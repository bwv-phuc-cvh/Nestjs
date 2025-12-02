import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { TokenService } from 'src/shared/services/token.service';
import { RoleService } from './role.service';
import {
  DeviceType,
  DisableTwoFactorBodyType,
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from './auth.model';
import { AuthRepository } from './auth.repo';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo';
import { addMilliseconds } from 'date-fns';
import envConfig from 'src/shared/config';
import ms, { StringValue } from 'ms';
import { VerificationCodeType } from 'generated/prisma';
import { EmailService } from 'src/shared/services/email.service';
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type';
import {
  EmailAlreadyRegisteredException,
  ExpiredOTPException,
  InvalidEmailException,
  InvalidOTPException,
  InvalidPasswordException,
  InvalidTOTPAndCodeException,
  InvalidTOTPException,
  OTPSendFailedException,
  RefreshTokenHasBeenRevokedException,
  RefreshTokenNotFoundException,
  TOTPAlreadyEnableException,
  TOTPNotEnableException,
} from './error.model';
import { TwoFactorAuthService } from 'src/shared/services/2fa.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly roleService: RoleService,
    private readonly emailService: EmailService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly twoFactorService: TwoFactorAuthService,
  ) {}
  private async checkValidOTP({ email, code, type }: { email: string; code: string; type: VerificationCodeType }) {
    const verificationCode = await this.authRepository.findUniqueVerificationCode({
      email,
      code,
      type,
    });

    if (!verificationCode) {
      throw InvalidOTPException;
    }

    if (verificationCode.expiresAt < new Date()) {
      throw ExpiredOTPException;
    }

    return verificationCode;
  }

  async register(body: RegisterBodyType) {
    const { email, code, name, password, phoneNumber } = body;

    try {
      await this.checkValidOTP({ email, code, type: VerificationCodeType.REGISTER });

      const clientRoleId = await this.roleService.getClientRoleId();
      const hashedPassword = await this.hashingService.hash(password);

      const [user] = await Promise.all([
        this.authRepository.createUser({
          email,
          password: hashedPassword,
          name,
          phoneNumber,
          roleId: clientRoleId,
          avatar: null,
        }),
        this.authRepository.deleteVerificationCode({
          email,
          code,
          type: VerificationCodeType.REGISTER,
        }),
      ]);

      return user;
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyRegisteredException;
      }
      throw error;
    }
  }

  async login(body: LoginBodyType & Pick<DeviceType, 'userAgent' | 'ip'>) {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    });

    if (!user) {
      throw InvalidEmailException;
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password);
    if (!isPasswordMatch) {
      throw InvalidPasswordException;
    }

    // 2. If the user has enabled 2FA, check if the TOTP or OTP code is valid.

    if (user.totpSecret) {
      if (!body.totpCode && !body.code) throw InvalidTOTPAndCodeException;

      if (body.totpCode) {
        const isValid = this.twoFactorService.verifyTOTP({
          email: user.email,
          secret: user.totpSecret,
          token: body.totpCode,
        });

        if (!isValid) throw InvalidTOTPException;
      }

      if (!body.totpCode && body.code) {
        await this.checkValidOTP({ email: user.email, code: body.code, type: VerificationCodeType.LOGIN });
      }
    }

    const existingDevice = await this.authRepository.findFirstDevice({
      userId: user.id,
      ip: body.ip,
      userAgent: body.userAgent,
    });
    let deviceId: number;

    if (existingDevice) {
      const device = await this.authRepository.updateDevice(existingDevice.id, {
        isActive: true,
        lastActive: new Date(),
      });

      deviceId = Number(device.id);
    } else {
      const { id } = await this.authRepository.createDevice({
        userId: user.id,
        userAgent: body.userAgent,
        ip: body.ip,
      });

      deviceId = id;
    }

    const refreshTokenRecord = await this.authRepository.findFirstRefreshToken({
      userId: user.id,
      deviceId,
    });

    if (refreshTokenRecord && refreshTokenRecord.expiresAt > new Date()) {
      throw new BadRequestException('Existing active session found. Please logout first.');
    }

    if (refreshTokenRecord) {
      await this.authRepository.deleteRefreshToken({ token: refreshTokenRecord.token });
    }

    if (body.code) {
      await this.authRepository.deleteVerificationCode({
        email: user.email,
        code: body.code,
        type: VerificationCodeType.LOGIN,
      });
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId,
      roleId: user.role.id,
      roleName: user.role.name,
    });

    return tokens;
  }

  async generateTokens(payload: AccessTokenPayloadCreate) {
    const { deviceId, roleId, roleName, userId } = payload;

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({
        userId,
      }),
    ]);
    const { exp } = await this.tokenService.verifyRefreshToken(refreshToken);

    await this.authRepository.createRefreshToken({
      userId,
      expiresAt: exp,
      token: refreshToken,
      deviceId,
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(payload: RefreshTokenBodyType & Pick<DeviceType, 'userAgent' | 'ip'>) {
    const { refreshToken, ip, userAgent } = payload;

    try {
      await this.tokenService.verifyRefreshToken(refreshToken);

      const refreshTokenRecord = await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
        token: refreshToken,
      });

      if (!refreshTokenRecord) {
        throw RefreshTokenNotFoundException;
      }

      const { deviceId, user, userId } = refreshTokenRecord;

      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        ip,
        userAgent,
      });
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({ token: refreshToken });
      const $token = this.generateTokens({
        userId,
        deviceId: deviceId,
        roleId: user.role.id,
        roleName: user.role.name,
      });

      const [_, __, tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $token]);

      return tokens;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }

  async logout(refreshToken: string) {
    try {
      await this.tokenService.verifyRefreshToken(refreshToken);

      const { deviceId } = await this.prismaService.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      await this.authRepository.updateDevice(deviceId, {
        isActive: false,
      });

      return { message: 'Logout successfully' };
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw RefreshTokenHasBeenRevokedException;
      }
      throw new UnauthorizedException();
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.sharedUserRepository.findUnique({ email: body.email });

    if (body.type === VerificationCodeType.REGISTER && user) {
      throw EmailAlreadyRegisteredException;
    }

    if (body.type === VerificationCodeType.FORGOT_PASSWORD && !user) {
      throw InvalidEmailException;
    }

    const code = generateOTP(6);

    await this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as StringValue)),
    });

    const { error } = await this.emailService.sendOTP({ email: body.email, code });

    if (error) {
      throw OTPSendFailedException;
    }

    return { message: 'OTP code sent successfully' };
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, password, code } = body;

    const user = await this.authRepository.findUniqueUserIncludeRole({
      email,
    });

    if (!user) {
      throw InvalidEmailException;
    }

    await this.checkValidOTP({ email, code, type: VerificationCodeType.FORGOT_PASSWORD });

    const hashedPassword = await this.hashingService.hash(password);

    await Promise.all([
      this.authRepository.updateUser(user.id, {
        password: hashedPassword,
      }),
      this.authRepository.deleteVerificationCode({
        email,
        code,
        type: VerificationCodeType.FORGOT_PASSWORD,
      }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  async setupTwoFactorAuth(userId: number) {
    // 1. Check if user has enabled 2FA
    const user = await this.sharedUserRepository.findUnique({
      id: userId,
    });

    if (!user) {
      throw InvalidEmailException;
    }

    if (user.totpSecret) {
      throw TOTPAlreadyEnableException;
    }

    // 2. create secret and uri
    const { secret, uri } = this.twoFactorService.generateTOTPSecret(user.email);

    // 3. update secret for user
    await this.authRepository.updateUser(user.id, { totpSecret: secret });

    return {
      secret,
      uri,
    };
  }

  async disablepTwoFactorAuth(data: DisableTwoFactorBodyType & { userId: number }) {
    const { userId, code, totpCode } = data;

    const user = await this.sharedUserRepository.findUnique({ id: userId });

    if (!user) throw InvalidEmailException;

    if (!user.totpSecret) {
      throw TOTPNotEnableException;
    }

    if (totpCode) {
      const isValid = this.twoFactorService.verifyTOTP({
        email: user.email,
        secret: user.totpSecret,
        token: totpCode,
      });

      if (!isValid) throw InvalidTOTPException;
    }

    if (!totpCode && code) {
      await this.checkValidOTP({ email: user.email, code, type: VerificationCodeType.DISABLE_2FA });
    }

    await this.authRepository.updateUser(user.id, { totpSecret: null });

    return {
      message: '2FA disabled successfully',
    };
  }
}

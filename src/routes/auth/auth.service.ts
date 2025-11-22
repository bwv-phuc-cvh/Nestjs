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
import { DeviceType, LoginBodyType, RefreshTokenBodyType, RegisterBodyType, SendOTPBodyType } from './auth.model';
import { AuthRepository } from './auth.repo';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo';
import { addMilliseconds } from 'date-fns';
import envConfig from 'src/shared/config';
import ms, { StringValue } from 'ms';
import { VerificationCodeType } from 'generated/prisma';
import { EmailService } from 'src/shared/services/email.service';
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type';

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
  ) {}
  async register(body: RegisterBodyType) {
    const { email, code, name, password, phoneNumber } = body;

    try {
      const verificationCode = await this.authRepository.findUniqueVerificationCode({
        email,
        code,
        type: VerificationCodeType.REGISTER,
      });

      if (!verificationCode) {
        throw new BadRequestException({
          field: 'code',
          message: 'Invalid OTP code',
        });
      }

      if (verificationCode.expiresAt < new Date()) {
        throw new BadRequestException({
          field: 'expiresAt',
          message: 'OTP code has expired',
        });
      }

      const clientRoleId = await this.roleService.getClientRoleId();
      const hashedPassword = await this.hashingService.hash(password);
      const user = await this.authRepository.createUser({
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        roleId: clientRoleId,
      });

      await this.authRepository.deleteVerificationCode({
        email,
        code,
        type: VerificationCodeType.REGISTER,
      });

      return user;
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new BadRequestException({
          field: 'email',
          message: 'Email is already registered',
        });
      }
      throw error;
    }
  }

  async login(body: LoginBodyType & Pick<DeviceType, 'userAgent' | 'ip'>) {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    });

    if (!user) {
      throw new BadRequestException({
        field: 'email',
        message: 'Account is not exist',
      });
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password);
    if (!isPasswordMatch) {
      throw new BadRequestException({
        field: 'password',
        error: 'Password is incorrect',
      });
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
        throw new UnauthorizedException('Refresh token has been used');
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
        throw new UnauthorizedException('Refresh token has been revoked');
      }
      throw new UnauthorizedException();
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.sharedUserRepository.findUnique({ email: body.email });

    if (user) {
      throw new BadRequestException({
        field: 'email',
        message: 'Email is already registered',
      });
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
      throw new BadRequestException({
        field: 'code',
        message: 'OTP code sending failed',
      });
    }

    return { message: 'OTP code sent successfully' };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import envConfig from 'src/shared/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { google } from 'googleapis';
import { GoogleAuthStateType } from './auth.model';
import { AuthService } from './auth.service';
import { RoleService } from './role.service';
import { HashingService } from 'src/shared/services/hashing.service';
import { AuthRepository } from './auth.repo';
import { v4 as uuidv4 } from 'uuid';
import { Device } from 'generated/prisma';

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client;

  constructor(
    private readonly authService: AuthService,
    private readonly authRepository: AuthRepository,
    private readonly roleService: RoleService,
    private readonly hashingService: HashingService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI,
    );
  }

  getGoogleAuthLink({ ip, userAgent }: GoogleAuthStateType) {
    const scope = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];
    const stateString = Buffer.from(
      JSON.stringify({
        userAgent,
        ip,
      }),
    ).toString('base64');

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scope,
      state: stateString,
      include_granted_scopes: true,
    });

    return { url };
  }

  async googleAuthCallback({ code, state }: { code: string; state: string }) {
    const { tokens } = await this.oauth2Client.getToken(code);

    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: envConfig.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Invalid Google Token');
    }

    const { email, name, picture } = payload as TokenPayload & { userAgent: string; ip: string };

    let stateDecoded: GoogleAuthStateType | null;
    try {
      stateDecoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch (e) {
      stateDecoded = null;
    }

    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: email!,
    });

    if (!user) {
      const clientRoleId = await this.roleService.getClientRoleId();
      const randomPassword = uuidv4();
      const hashedPassword = await this.hashingService.hash(randomPassword);
      const userCreated = await this.authRepository.createUserIncludeRole({
        email: email!,
        name: name!,
        password: hashedPassword,
        roleId: clientRoleId,
        phoneNumber: '',
        avatar: picture ?? null,
      });

      const { id: deviceId } = await this.authRepository.createDevice({
        userId: userCreated.id,
        userAgent: stateDecoded?.userAgent || '',
        ip: stateDecoded?.ip || '',
      });

      const tokens = await this.authService.generateTokens({
        userId: userCreated.id,
        deviceId,
        roleId: userCreated.role.id,
        roleName: userCreated.role.name,
      });

      return tokens;
    } else {
      const device = (await this.authRepository.findFirstDevice({
        userId: user.id,
        ip: stateDecoded?.ip,
        userAgent: stateDecoded?.userAgent,
      })) as Device;

      const { id: deviceId } = await this.authRepository.updateDevice(device.id, {
        isActive: true,
        lastActive: new Date(),
      });

      const tokens = await this.authService.generateTokens({
        userId: user.id,
        deviceId,
        roleId: user.role.id,
        roleName: user.role.name,
      });

      return tokens;
    }
  }
}

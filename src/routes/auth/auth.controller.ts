import { Body, Controller, Get, HttpStatus, Ip, Post, Query, Res } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import {
  LoginBodyDTO,
  LoginResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
  RefreshTokenBodyDTO,
  LogoutResDTO,
  GoogleAuthUrlDTO,
  ForgotPasswordBodyDTO,
} from 'src/routes/auth/auth.dto';
import { AuthService } from 'src/routes/auth/auth.service';
import { DeviceType } from './auth.model';
import { UserAgent } from 'src/shared/decorators/user-agent.decorator';
import { MessageResDTO } from 'src/shared/dtos/response.dto';
import { AuthPublic } from 'src/shared/decorators/auth.decorator';
import { GoogleService } from './google.service';
import type { Response } from 'express';
import envConfig from 'src/shared/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('register')
  @AuthPublic()
  @ZodResponse({ type: RegisterResDTO })
  async register(@Body() body: RegisterBodyDTO) {
    return this.authService.register(body);
  }

  @Post('otp')
  @AuthPublic()
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return this.authService.sendOTP(body);
  }

  @Post('login')
  @AuthPublic()
  @ZodResponse({ type: LoginResDTO, status: HttpStatus.OK })
  async login(
    @Body() body: LoginBodyDTO & Pick<DeviceType, 'userAgent' | 'ip'>,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
  ) {
    return this.authService.login({
      ...body,
      userAgent,
      ip,
    });
  }

  @Post('refresh-token')
  @AuthPublic()
  async refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.refreshToken({
      refreshToken: body.refreshToken,
      userAgent,
      ip,
    });
  }

  @Post('logout')
  @ZodResponse({ type: MessageResDTO, status: HttpStatus.OK })
  async logout(@Body() body: LogoutResDTO) {
    return this.authService.logout(body.refreshToken);
  }

  @Get('google-link')
  @ZodResponse({ type: GoogleAuthUrlDTO })
  @AuthPublic()
  getGoogleAuthLink(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.googleService.getGoogleAuthLink({
      userAgent,
      ip,
    });
  }

  @Get('google/callback')
  @AuthPublic()
  async googleAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      const data = await this.googleService.googleAuthCallback({ code, state });

      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`,
      );
    } catch (error) {
      return res.redirect(`${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?error=Authentication%20Failed`);
    }
  }

  @Post('forgot-password')
  @AuthPublic()
  async forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body);
  }
}

import { Body, Controller, Ip, Post, Req } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { LoginBodyDTO, LoginResDTO, RegisterBodyDTO, RegisterResDTO, SendOTPBodyDTO } from 'src/routes/auth/auth.dto';
import { AuthService } from 'src/routes/auth/auth.service';
import { DeviceType } from './auth.model';
import { UserAgent } from 'src/shared/decorators/user-agent.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodResponse({ type: RegisterResDTO })
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('otp')
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body);
  }

  @Post('login')
  @ZodResponse({ type: LoginResDTO })
  async login(
    @Body() body: LoginBodyDTO & Pick<DeviceType, 'userAgent' | 'ip'>,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
  ) {
    return await this.authService.login({
      ...body,
      userAgent,
      ip,
    });
  }

  // @Post('refresh-token')
  // @HttpCode(HttpStatus.OK)
  // async refreshToken(@Body() body: any) {
  //   return await this.authService.refreshToken(body.refreshToken);
  // }

  // @Post('logout')
  // async logout(@Body() body: any) {
  // return new LogoutResDTO(await this.authService.logout(body.refreshToken))
  // }
}

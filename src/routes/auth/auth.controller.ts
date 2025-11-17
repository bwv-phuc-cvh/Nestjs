import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { LoginBodyDTO, RegisterBodyDTO, RegisterResDTO } from 'src/routes/auth/auth.dto';
import { AuthService } from 'src/routes/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodResponse({ type: RegisterResDTO })
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginBodyDTO) {
    return await this.authService.login(body);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: any) {
    return await this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: any) {
    // return new LogoutResDTO(await this.authService.logout(body.refreshToken))
  }
}

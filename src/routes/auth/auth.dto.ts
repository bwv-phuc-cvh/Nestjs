import { createZodDto } from 'nestjs-zod';
import {
  ForgotPasswordBodySchema,
  GoogleAuthUrlSchema,
  LoginBodySchema,
  LoginResSchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOTPBodySchema,
} from './auth.model';

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
export class RegisterResDTO extends createZodDto(RegisterResSchema) {}
export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}
export class LoginResDTO extends createZodDto(LoginResSchema) {}
export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) {}
export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}
export class LogoutResDTO extends createZodDto(LogoutBodySchema) {}
export class GoogleAuthUrlDTO extends createZodDto(GoogleAuthUrlSchema) {}
export class ForgotPasswordBodyDTO extends createZodDto(ForgotPasswordBodySchema) {}

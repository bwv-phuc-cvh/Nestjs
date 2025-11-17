import { createZodDto } from 'nestjs-zod';
import { LoginBodySchema, RegisterBodySchema, RegisterResSchema } from './auth.model';

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
export class RegisterResDTO extends createZodDto(RegisterResSchema) {}
export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

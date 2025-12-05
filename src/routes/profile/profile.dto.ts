import { createZodDto } from 'nestjs-zod';
import { ProfileBodySchema, ProfileChangePasswordBodySchema } from './profile.model';

export class ProfileBodyDTO extends createZodDto(ProfileBodySchema) {}
export class ProfileChangePasswordBodyDTO extends createZodDto(ProfileChangePasswordBodySchema) {}

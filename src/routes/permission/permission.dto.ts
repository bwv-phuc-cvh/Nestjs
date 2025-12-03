import { createZodDto } from 'nestjs-zod';
import { CreatePermissionBodySchema, GetPermissionsQuerySchema, UpdatePermissionBodySchema } from './permission.model';

export class CreatePermissionBodyDTO extends createZodDto(CreatePermissionBodySchema) {}
export class UpdatePermissionBodyDTO extends createZodDto(UpdatePermissionBodySchema) {}
export class GetPermissionsQueryDTO extends createZodDto(GetPermissionsQuerySchema) {}

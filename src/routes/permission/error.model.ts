import { BadRequestException } from '@nestjs/common';

export const PermissionNotFound = new BadRequestException({
  field: 'permission',
  message: 'Permission not found',
});

export const PermissionAlreadyExistdException = new BadRequestException({
  field: 'permission',
  message: 'Permission is already exist',
});

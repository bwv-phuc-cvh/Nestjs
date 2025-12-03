import { Injectable } from '@nestjs/common';
import { CreatePermissionBodyType, GetPermissionsQueryType, UpdatePermissionBodyType } from './permission.model';
import { PermissionRepository } from './permission.repo';
import { PermissionAlreadyExistdException, PermissionNotFound } from './error.model';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  async create(data: CreatePermissionBodyType, userId: number) {
    const { name, path, method, module } = data;

    const permission = await this.permissionRepo.findOne({
      name,
      path,
      method,
      module,
    });

    if (permission) {
      throw PermissionAlreadyExistdException;
    }

    return this.permissionRepo.create({ ...data, createdById: userId });
  }

  async findAll(pagination: GetPermissionsQueryType) {
    return await this.permissionRepo.findAll(pagination);
  }

  async findOne(id: number) {
    const permission = await this.permissionRepo.findByPK(id);

    if (!permission) {
      throw PermissionNotFound;
    }

    return permission;
  }

  async update(id: number, data: UpdatePermissionBodyType, userId: number) {
    const isValid = await this.permissionRepo.findByPK(id);

    if (!isValid) {
      throw PermissionNotFound;
    }

    const { path, method, module, name } = data;

    const permission = await this.permissionRepo.findOne({
      name,
      path,
      method,
      module,
    });

    if (permission) {
      throw PermissionAlreadyExistdException;
    }

    return this.permissionRepo.update(id, { ...data, updatedById: userId });
  }

  async delete(id: number) {
    const isValid = await this.permissionRepo.findByPK(id);

    if (!isValid) {
      throw PermissionNotFound;
    }

    return {
      message: 'Delete successfully',
    };
  }
}

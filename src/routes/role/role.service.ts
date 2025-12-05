import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleBodyType, GetRolesQueryType, UpdateRoleBodyType } from 'src/routes/role/role.model';
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers';
import { ProhibitedActionOnBaseRoleException, RoleAlreadyExistsException } from 'src/routes/role/role.error';
import { RoleName } from 'src/shared/constants/role.constant';
import { RoleRepo } from './role.repo';
import { Role } from 'generated/prisma';

@Injectable()
export class RoleService {
  constructor(private roleRepo: RoleRepo) {}

  async list(pagination: GetRolesQueryType) {
    const data = await this.roleRepo.list(pagination);
    return data;
  }

  async findById(id: number) {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw NotFoundException;
    }
    return role;
  }

  async create({ data, createdById }: { data: CreateRoleBodyType; createdById: number }) {
    try {
      const role = await this.roleRepo.create({
        createdById,
        data,
      });
      return role;
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException;
      }
      throw error;
    }
  }

  private async verifyRole(roleId: number) {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw NotFoundException;
    }
    const baseRoles: string[] = [RoleName.Admin, RoleName.Client, RoleName.Seller];

    if (baseRoles.includes(role.name)) {
      throw ProhibitedActionOnBaseRoleException;
    }
  }

  async update({ id, data, updatedById }: { id: number; data: UpdateRoleBodyType; updatedById: number }) {
    try {
      await this.verifyRole(id);
      const updatedRole = await this.roleRepo.update({
        id,
        updatedById,
        data,
      });
      return updatedRole;
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundException;
      }
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException;
      }
      throw error;
    }
  }

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.verifyRole(id);
      await this.roleRepo.delete({
        id,
        deletedById,
      });

      return {
        message: 'Delete successfully',
      };
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundException;
      }
      throw error;
    }
  }
}

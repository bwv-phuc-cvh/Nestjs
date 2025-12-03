import { Injectable } from '@nestjs/common';
import {
  CreateRoleBodyType,
  GetRolesQueryType,
  GetRolesResType,
  RoleWithPermissionsType,
  UpdateRoleBodyType,
} from 'src/routes/role/role.model';
import { RoleType } from 'src/shared/models/role.model';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class RoleRepo {
  constructor(private prismaService: PrismaService) {}

  async list(pagination: GetRolesQueryType) {
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;
    const [totalItems, data] = await this.prismaService.$transaction([
      this.prismaService.role.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.role.findMany({
        where: {
          deletedAt: null,
        },
        skip,
        take,
      }),
    ]);
    return {
      data,
      totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
    };
  }

  async findById(id: number) {
    return this.prismaService.role.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: {
            deletedAt: null,
          },
        },
      },
    });
  }

  async findOne(condition: Partial<RoleType>) {
    return this.prismaService.role.findFirst({
      where: condition,
    });
  }

  async create({ createdById, data }: { createdById: number | null; data: CreateRoleBodyType }) {
    return this.prismaService.role.create({
      data: {
        ...data,
        createdById,
      },
    });
  }

  async update({ id, updatedById, data }: { id: number; updatedById: number; data: UpdateRoleBodyType }) {
    // Kiểm tra nếu có bất cứ permissionId nào mà đã soft delete thì không cho phép cập nhật
    if (data.permissionIds.length > 0) {
      const permissions = await this.prismaService.permission.findMany({
        where: {
          id: {
            in: data.permissionIds,
          },
        },
      });
      const deletedPermission = permissions.filter((permission) => permission.deletedAt);
      if (deletedPermission.length > 0) {
        const deletedIds = deletedPermission.map((permission) => permission.id).join(', ');
        throw new Error(`Permission with id has been deleted: ${deletedIds}`);
      }
    }

    return this.prismaService.role.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: {
          set: data.permissionIds.map((id) => ({ id })),
        },
        updatedById,
      },
      include: {
        permissions: {
          where: {
            deletedAt: null,
          },
        },
      },
    });
  }

  async delete(
    {
      id,
      deletedById,
    }: {
      id: number;
      deletedById: number;
    },
    isHard?: boolean,
  ) {
    return isHard
      ? this.prismaService.role.delete({
          where: {
            id,
          },
        })
      : this.prismaService.role.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            deletedById,
          },
        });
  }
}

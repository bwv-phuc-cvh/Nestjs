import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import {
  CreatePermissionBodyType,
  GetPermissionsQueryType,
  PermissionType,
  UpdatePermissionBodyType,
} from './permission.model';

@Injectable()
export class PermissionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreatePermissionBodyType & { createdById: number }) {
    return this.prismaService.permission.create({
      data,
    });
  }

  async update(id: number, data: UpdatePermissionBodyType & { updatedById: number }) {
    return this.prismaService.permission.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, softDelete?: boolean) {
    if (softDelete) {
      return this.prismaService.permission.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    return this.prismaService.permission.delete({ where: { id } });
  }

  async findByPK(id: number) {
    return this.prismaService.permission.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findOne(uniqueObject: Partial<PermissionType>) {
    return this.prismaService.permission.findFirst({
      where: uniqueObject,
    });
  }

  async findAll(pagination: GetPermissionsQueryType) {
    const skip = (pagination.page - 1) * pagination.limit;
    const take = pagination.limit;

    const [total, data] = await this.prismaService.$transaction([
      this.prismaService.permission.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.permission.findMany({ where: { deletedAt: null }, take, skip }),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }
}

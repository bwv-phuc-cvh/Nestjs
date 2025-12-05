import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { UserType } from '../models/user.model';

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUnique(uniqueObject: { email: string } | { id: number }) {
    return this.prismaService.user.findUnique({
      where: uniqueObject,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                id: true,
                name: true,
                module: true,
                path: true,
                method: true,
              },
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });
  }

  async updateUser(userId: number, data: Partial<UserType>) {
    return this.prismaService.user.update({
      where: { id: userId },
      data,
    });
  }
}

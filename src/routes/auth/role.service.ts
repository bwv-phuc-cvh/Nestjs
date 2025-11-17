import { Injectable } from '@nestjs/common';
import { RoleName } from 'src/shared/constants/role.constant';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class RoleService {
  private clientRoleId: number | null = null;

  constructor(private readonly prismaService: PrismaService) {}

  async getClientRoleId() {
    if (this.clientRoleId) {
      return this.clientRoleId;
    }

    const clientRole = await this.prismaService.role.findUniqueOrThrow({
      where: {
        name: RoleName.Client,
      },
    });

    this.clientRoleId = clientRole.id;
    return this.clientRoleId;
  }
}

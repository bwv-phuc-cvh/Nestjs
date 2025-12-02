import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { DeviceType, RefreshTokenType, RegisterBodyType, VerificationType } from './auth.model';
import { UserType } from 'src/shared/models/user.model';
import { VerificationCodeType } from 'generated/prisma';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & Pick<UserType, 'roleId' | 'avatar'>) {
    return this.prismaService.user.create({
      data: user,
    });
  }

  async updateUser(userId: number, data: Partial<UserType>) {
    return this.prismaService.user.update({
      where: { id: userId },
      data,
    });
  }

  async createUserIncludeRole(
    user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & Pick<UserType, 'roleId' | 'avatar'>,
  ) {
    return this.prismaService.user.create({
      data: user,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findUniqueUserIncludeRole(uniqueObject: { email: string } | { id: number }) {
    return this.prismaService.user.findUnique({
      where: uniqueObject,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async createVerificationCode(payload: Pick<VerificationType, 'email' | 'type' | 'code' | 'expiresAt'>) {
    const { code, email, expiresAt, type } = payload;

    return this.prismaService.verificationCode.upsert({
      where: {
        email_type: {
          email,
          type,
        },
      },
      create: payload,
      update: {
        code: code,
        expiresAt: expiresAt,
      },
    });
  }

  async findUniqueVerificationCode(uniqueValue: { email: string; type: VerificationCodeType; code: string }) {
    const { email, code, type } = uniqueValue;

    return this.prismaService.verificationCode.findUnique({
      where: {
        email_type: {
          email,
          type,
        },
        code,
      },
    });
  }

  async deleteVerificationCode(uniqueValue: { email: string; type: VerificationCodeType; code: string }) {
    const { email, code, type } = uniqueValue;

    return this.prismaService.verificationCode.delete({
      where: {
        email_type: {
          email,
          type,
        },
        code,
      },
    });
  }

  async createRefreshToken(payload: Omit<RefreshTokenType, 'expiresAt' | 'createdAt'> & { expiresAt: number }) {
    const { deviceId, expiresAt: exp, token, userId } = payload;

    return this.prismaService.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(exp * 1000),
        deviceId,
      },
    });
  }

  async deleteRefreshToken(uniqueObject: { token: string }) {
    return this.prismaService.refreshToken.delete({
      where: uniqueObject,
    });
  }

  async findUniqueRefreshTokenIncludeUserRole(uniqueObject: { token: string }) {
    return this.prismaService.refreshToken.findUnique({
      where: uniqueObject,
      include: {
        user: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findFirstRefreshToken(uniqueObject: Partial<RefreshTokenType>) {
    return this.prismaService.refreshToken.findFirst({
      where: uniqueObject,
    });
  }

  async createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> & Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>,
  ) {
    return this.prismaService.device.create({
      data,
    });
  }

  async findFirstDevice(uniqueObject: Partial<DeviceType>) {
    return this.prismaService.device.findFirst({
      where: uniqueObject,
    });
  }

  async updateDevice(deviceId: number, data: Partial<DeviceType>) {
    return this.prismaService.device.update({
      where: { id: deviceId },
      data,
    });
  }
}

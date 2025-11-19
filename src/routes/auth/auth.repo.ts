import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { RegisterBodyType, VerificationType } from './auth.model';
import { UserType } from 'src/shared/models/user.model';
import { VerificationCodeType } from 'generated/prisma';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> & Pick<UserType, 'roleId'>) {
    return this.prismaService.user.create({
      data: user,
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
}

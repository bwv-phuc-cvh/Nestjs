import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { TokenService } from 'src/shared/services/token.service';
import { AccessTokenPayload } from '../types/jwt.type';
import { Request } from 'express';
import { PrismaService } from '../services/prisma.service';
import { HTTPMethod } from 'generated/prisma';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}
  private extractAccessTokenFromHeader(request: Request) {
    const accessToken = request.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    return accessToken;
  }

  private async extractAndValidateToken(request: Request) {
    const accessToken = this.extractAccessTokenFromHeader(request);

    try {
      const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken);

      request[REQUEST_USER_KEY] = decodedAccessToken;
      return decodedAccessToken;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  private async validateUserPermission(decodedAccessToken: AccessTokenPayload, request: Request) {
    const roleId = decodedAccessToken.roleId;
    const path = request.route.path;
    const method = request.method as keyof typeof HTTPMethod;
    const role = await this.prismaService.role
      .findUniqueOrThrow({
        where: {
          id: roleId,
          deletedAt: null,
        },
        include: {
          permissions: {
            where: {
              deletedAt: null,
              path,
              method,
            },
          },
        },
      })
      .catch(() => {
        throw new ForbiddenException();
      });

    const canAccess = role.permissions.length > 0;

    if (!canAccess) {
      throw new ForbiddenException();
    }

    return canAccess;
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const decodedAccessToken = await this.extractAndValidateToken(request);

    await this.validateUserPermission(decodedAccessToken, request);

    return true;
  }
}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RoleService } from './role.service';
import { AuthRepository } from './auth.repo';
import { EmailService } from 'src/shared/services/email.service';

@Module({
  providers: [AuthService, RoleService, AuthRepository, EmailService],
  controllers: [AuthController],
})
export class AuthModule {}

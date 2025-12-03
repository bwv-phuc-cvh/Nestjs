import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repo';
import { EmailService } from 'src/shared/services/email.service';
import { GoogleService } from './google.service';
import { RoleService } from '../role/role.service';
import { RoleRepo } from '../role/role.repo';

@Module({
  providers: [AuthService, RoleService, RoleRepo, AuthRepository, EmailService, GoogleService],
  controllers: [AuthController],
})
export class AuthModule {}

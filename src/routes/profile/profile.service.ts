import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProfileBodyType, ProfileChangePasswordBodyType } from './profile.model';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo';
import { HashingService } from 'src/shared/services/hashing.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly hashingService: HashingService,
  ) {}

  private validateUserAction(id: number, userId: number) {
    if (id !== userId) {
      throw new ForbiddenException('You are not allowed to update this profile');
    }

    return true;
  }

  async findOne(id: number, userId: number) {
    if (id !== userId) {
      throw new ForbiddenException('You are not allowed to view this profile');
    }

    const user = await this.sharedUserRepository.findUnique({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateProfileDto: ProfileBodyType, userId: number) {
    this.validateUserAction(id, userId);

    return this.sharedUserRepository.updateUser(id, { ...updateProfileDto, updatedById: userId });
  }

  async updatePassword(id: number, updatePasswordDto: ProfileChangePasswordBodyType, userId: number) {
    this.validateUserAction(id, userId);

    const user = await this.sharedUserRepository.findUnique({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordMatching = await this.hashingService.compare(updatePasswordDto.password, user.password);

    if (!isPasswordMatching) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await this.hashingService.hash(updatePasswordDto.newPassword);

    return this.sharedUserRepository.updateUser(id, { password: hashedNewPassword, updatedById: userId });
  }
}

import { Controller, Get, Body, Param, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileBodyDTO, ProfileChangePasswordBodyDTO } from './profile.dto';
import { ZodResponse } from 'nestjs-zod';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';
import { GetUserProfileResDTO } from 'src/shared/dtos/shared-user.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  @ZodResponse({ type: GetUserProfileResDTO })
  findOne(@Param('id') id: string, @ActiveUser('userId') userId: number) {
    return this.profileService.findOne(+id, userId);
  }

  @Put('/')
  update(@Param('id') id: string, @Body() updateProfileDto: ProfileBodyDTO, @ActiveUser('userId') userId: number) {
    return this.profileService.update(+id, updateProfileDto, userId);
  }

  @Put('/password')
  updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: ProfileChangePasswordBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.profileService.updatePassword(+id, updatePasswordDto, userId);
  }
}

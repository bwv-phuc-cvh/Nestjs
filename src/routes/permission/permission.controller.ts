import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionBodyDTO, GetPermissionsQueryDTO, UpdatePermissionBodyDTO } from './permission.dto';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() body: CreatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.create(body, userId);
  }

  @Get()
  findAll(@Query() query: GetPermissionsQueryDTO) {
    return this.permissionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdatePermissionBodyDTO, @ActiveUser('userId') userId: number) {
    return this.permissionService.update(+id, body, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.permissionService.delete(+id);
  }
}

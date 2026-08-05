import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { parsePage, parsePageSize } from '../common/pagination';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { CreateReturnDto } from './dto/create-return.dto';
import { DecideReturnDto } from './dto/decide-return.dto';
import { ReturnsService } from './returns.service';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Post()
  @Roles('CUSTOMER')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReturnDto) {
    return this.returns.create(user.id, dto);
  }

  @Get('mine')
  @Roles('CUSTOMER')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.returns.mine(user.id);
  }

  @Get()
  @Roles('ADMIN', 'SELLER')
  @Permissions('orders:refund')
  listAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.returns.listAll(user, parsePage(page), parsePageSize(pageSize), status as never);
  }

  @Patch(':id/decide')
  @Roles('ADMIN', 'SELLER')
  @Permissions('orders:refund')
  @HttpCode(HttpStatus.OK)
  decide(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: DecideReturnDto) {
    return this.returns.decide(user, id, dto);
  }
}

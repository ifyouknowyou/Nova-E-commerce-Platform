import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { parsePage, parsePageSize } from '../common/pagination';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  /** Customer-facing: check whether a code is valid against a cart subtotal. */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @Roles('CUSTOMER', 'SELLER', 'ADMIN')
  validate(@Body() dto: ValidateCouponDto) {
    return this.coupons.validate(dto.code, dto.subtotal);
  }

  @Get()
  @Roles('ADMIN', 'SELLER')
  @Permissions('coupons:manage')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.coupons.list(user, parsePage(page), parsePageSize(pageSize), storeId);
  }

  @Post()
  @Roles('ADMIN', 'SELLER')
  @Permissions('coupons:manage')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCouponDto) {
    return this.coupons.create(user, dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SELLER')
  @Permissions('coupons:manage')
  @HttpCode(HttpStatus.OK)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(user, id, dto);
  }

  @Patch(':id/toggle')
  @Roles('ADMIN', 'SELLER')
  @Permissions('coupons:manage')
  @HttpCode(HttpStatus.OK)
  toggle(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.coupons.toggle(user, id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SELLER')
  @Permissions('coupons:manage')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.coupons.remove(user, id);
  }
}

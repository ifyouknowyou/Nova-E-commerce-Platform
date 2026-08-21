import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { OrdersService, type OrderDetailResponse } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutOrderDto,
  ): Promise<OrderDetailResponse> {
    return this.orders.checkout(this.requireUser(user), dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.getMyOrders(this.requireUser(user));
  }

  @Get(':id')
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<OrderDetailResponse> {
    return this.orders.getOrderDetail(this.requireUser(user), id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<OrderDetailResponse> {
    return this.orders.cancel(this.requireUser(user), id);
  }

  private requireUser(user: AuthenticatedUser | undefined): string {
    if (!user) throw new UnauthorizedException('Sign in to manage orders');
    return user.id;
  }
}
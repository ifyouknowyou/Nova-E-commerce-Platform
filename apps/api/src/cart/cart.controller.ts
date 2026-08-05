import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Public } from '../rbac/decorators/public.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { CartService, type CartResponse } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

/** Guest-cart session token — generated client-side, kept in localStorage. */
const SESSION_HEADER = 'x-session-token';

@Controller('cart')
@Public()
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(SESSION_HEADER) sessionToken?: string,
  ): Promise<CartResponse> {
    return this.cart.getCart(user?.id, sessionToken);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  addItem(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(SESSION_HEADER) sessionToken: string | undefined,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponse> {
    return this.cart.addItem(user?.id, sessionToken, dto);
  }

  @Patch('items/:id')
  @HttpCode(HttpStatus.OK)
  updateItem(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(SESSION_HEADER) sessionToken: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    return this.cart.updateItem(user?.id, sessionToken, id, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  removeItem(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(SESSION_HEADER) sessionToken: string | undefined,
    @Param('id') id: string,
  ): Promise<CartResponse> {
    return this.cart.removeItem(user?.id, sessionToken, id);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  merge(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers(SESSION_HEADER) sessionToken: string,
  ): Promise<CartResponse> {
    if (!user) throw new UnauthorizedException('Sign in to merge your cart');
    return this.cart.mergeGuestCart(user.id, sessionToken);
  }
}

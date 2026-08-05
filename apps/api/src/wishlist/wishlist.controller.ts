import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { WishlistService, type WishlistItemResponse } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<WishlistItemResponse[]> {
    return this.wishlist.list(user.id);
  }

  @Post(':productId')
  @HttpCode(HttpStatus.OK)
  add(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.wishlist.add(user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.wishlist.remove(user.id, productId);
  }
}
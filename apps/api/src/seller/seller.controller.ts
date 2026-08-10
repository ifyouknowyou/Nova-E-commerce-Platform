import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { parsePage, parsePageSize } from '../common/pagination';
import { ExcludeRoles } from '../rbac/decorators/exclude-roles.decorator';
import { Roles } from '../rbac/decorators/roles.decorator';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { AddImagesDto } from './dto/add-images.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { SellerService } from './seller.service';

@Controller('seller')
@Roles('SELLER')
@ExcludeRoles('ADMIN')
export class SellerController {
  constructor(private readonly seller: SellerService) {}

  // ── Products ─────────────────────────────────────────────────────────────

  @Get('products')
  listProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.seller.listProducts(user.id, parsePage(page), parsePageSize(pageSize));
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  createProduct(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.seller.createProduct(user.id, dto);
  }

  @Patch('products/:id')
  @HttpCode(HttpStatus.OK)
  updateProduct(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.seller.updateProduct(user.id, id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  deleteProduct(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.seller.deleteProduct(user.id, id);
  }

  @Patch('products/:id/inventory')
  @HttpCode(HttpStatus.OK)
  updateInventory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStockDto) {
    return this.seller.updateInventory(user.id, id, dto);
  }

  // ── Product images ────────────────────────────────────────────────────────

  @Post('products/:id/images')
  @HttpCode(HttpStatus.OK)
  addImages(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: AddImagesDto) {
    return this.seller.addImages(user.id, id, dto.images);
  }

  @Post('products/:id/images/:imageId/primary')
  @HttpCode(HttpStatus.OK)
  setPrimaryImage(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('imageId') imageId: string) {
    return this.seller.setPrimaryImage(user.id, id, imageId);
  }

  @Delete('products/:id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  removeImage(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('imageId') imageId: string) {
    return this.seller.removeImage(user.id, id, imageId);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: AuthenticatedUser) {
    return this.seller.analytics(user.id);
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  @Get('orders')
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.seller.listOrders(user.id, parsePage(page), parsePageSize(pageSize));
  }

  @Patch('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  updateOrderStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.seller.updateOrderItemStatus(user.id, id, dto.status);
  }
}
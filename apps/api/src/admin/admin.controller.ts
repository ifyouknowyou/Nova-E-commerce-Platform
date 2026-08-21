import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { parsePage, parsePageSize } from '../common/pagination';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { AdminService } from './admin.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AssignProductDto } from './dto/assign-product.dto';
import { ModerateProductDto } from './dto/moderate-product.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateStoreStatusDto } from './dto/update-store-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  listUsers(@Query('q') q?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listUsers(parsePage(page), parsePageSize(pageSize), q);
  }

  @Get('audit-logs')
  listAuditLogs(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listAuditLogs(parsePage(page), parsePageSize(pageSize));
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @Permissions('users:manage')
  setUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.setUserStatus(id, dto.status);
  }

  @Get('sellers')
  listSellers(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listSellers(parsePage(page), parsePageSize(pageSize));
  }

  @Patch('sellers/:id/status')
  @HttpCode(HttpStatus.OK)
  @Permissions('sellers:manage')
  setStoreStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoreStatusDto,
  ) {
    return this.admin.setStoreStatus(id, dto.status, user.id);
  }

  @Delete('sellers/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('sellers:manage')
  deleteSeller(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.admin.deleteSeller(id, user.id);
  }

  @Get('products')
  listProducts(@Query('status') status?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listProducts(status as never, parsePage(page), parsePageSize(pageSize));
  }

  @Post('products/:id/moderate')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:approve')
  moderateProduct(@Param('id') id: string, @Body() dto: ModerateProductDto) {
    return this.admin.moderateProduct(id, dto.status);
  }

  @Post('products/:id/feature')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:update')
  toggleFeatured(@Param('id') id: string) {
    return this.admin.toggleFeatured(id);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:delete')
  deleteProduct(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.admin.deleteProduct(id, user.id);
  }

  @Patch('products/:id/assign')
  @HttpCode(HttpStatus.OK)
  @Permissions('products:update')
  assignProduct(@Param('id') id: string, @Body() dto: AssignProductDto) {
    return this.admin.assignProduct(id, dto);
  }

  @Get('orders')
  listOrders(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listOrders(parsePage(page), parsePageSize(pageSize));
  }

  @Get('reviews')
  listReviews(@Query('status') status?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listReviews(
      (['PENDING', 'APPROVED', 'HIDDEN'] as const).find((s) => s === status),
      parsePage(page),
      parsePageSize(pageSize),
    );
  }

  @Post('reviews/:id/moderate')
  @HttpCode(HttpStatus.OK)
  @Permissions('reviews:manage')
  moderateReview(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.admin.moderateReview(id, dto.status);
  }

  // ── Categories ───────────────────────────────────────────────────────────

  @Get('categories')
  listCategories() {
    return this.admin.listCategories();
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('categories:manage')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Patch('categories/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:manage')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.admin.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('categories:manage')
  deleteCategory(@Param('id') id: string) {
    return this.admin.deleteCategory(id);
  }

  // ── Brands ───────────────────────────────────────────────────────────────

  @Get('brands')
  listBrands() {
    return this.admin.listBrands();
  }

  @Post('brands')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('brands:manage')
  createBrand(@Body() dto: CreateBrandDto) {
    return this.admin.createBrand(dto);
  }

  @Patch('brands/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('brands:manage')
  updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.admin.updateBrand(id, dto);
  }

  @Delete('brands/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('brands:manage')
  deleteBrand(@Param('id') id: string) {
    return this.admin.deleteBrand(id);
  }
}
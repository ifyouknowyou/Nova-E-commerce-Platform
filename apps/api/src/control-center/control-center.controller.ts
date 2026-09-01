import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { OrganizationGuard, CurrentOrganization, CurrentMembership } from '../organization/organization.guard';
import type { Organization, OrganizationMembership } from '@prisma/client';
import { ControlCenterService } from './control-center.service';

@Controller('control-center')
@UseGuards(OrganizationGuard)
export class ControlCenterController {
  constructor(private readonly service: ControlCenterService) {}

  @Get('overview')
  overview(
    @CurrentUser() _user: AuthenticatedUser,
    @CurrentOrganization() org: Organization,
    @CurrentMembership() membership: OrganizationMembership,
  ) {
    return this.service.getOverview(org.id, membership);
  }

  @Get('customers')
  customers(
    @CurrentUser() _user: AuthenticatedUser,
    @CurrentOrganization() org: Organization,
    @Query('search') search?: string,
  ) {
    return this.service.getCustomers(org.id, search);
  }

  @Get('inventory')
  inventory(
    @CurrentUser() _user: AuthenticatedUser,
    @CurrentOrganization() org: Organization,
    @Query('low') low?: string,
  ) {
    return this.service.getInventory(org.id, low === 'true' || low === '1');
  }

  @Get('orders')
  orders(
    @CurrentUser() _user: AuthenticatedUser,
    @CurrentOrganization() org: Organization,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getOrders(org.id, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      paymentStatus,
      search,
    });
  }

  @Get('products')
  products(
    @CurrentUser() _user: AuthenticatedUser,
    @CurrentOrganization() org: Organization,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoryIds') categoryIds?: string,
    @Query('brandId') brandId?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.service.getProducts(org.id, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
      status,
      categoryIds: categoryIds ? categoryIds.split(',') : undefined,
      brandId,
      lowStock: lowStock === 'true' || lowStock === '1',
    });
  }

  @Get('brands')
  brands(@CurrentOrganization() org: Organization) {
    return this.service.getBrands(org.id);
  }

  @Get('categories')
  categories(@CurrentOrganization() org: Organization) {
    return this.service.getCategories(org.id);
  }

  @Get('coupons')
  coupons(
    @CurrentOrganization() org: Organization,
    @Query('status') status?: string,
  ) {
    return this.service.getCoupons(org.id, status);
  }

  @Get('finance')
  finance(@CurrentOrganization() org: Organization) {
    return this.service.getFinanceSummary(org.id);
  }

  @Get('insights')
  insights(@CurrentOrganization() org: Organization) {
    return this.service.getInsights(org.id);
  }
}

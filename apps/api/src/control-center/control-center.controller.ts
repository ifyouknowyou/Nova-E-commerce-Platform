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
}

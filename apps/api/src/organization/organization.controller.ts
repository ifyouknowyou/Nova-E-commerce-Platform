import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { OrganizationGuard, CurrentOrganization } from './organization.guard';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import type { Organization } from '@prisma/client';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    dto.normalize();
    return this.service.create(user.id, dto.name, dto.slug);
  }

  @Get(':id')
  @UseGuards(OrganizationGuard)
  getOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getById(id, user.id, user.roleCodes.includes('ADMIN'));
  }

  @Patch(':id')
  @UseGuards(OrganizationGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganizationDto,
    @CurrentOrganization() _org: Organization,
  ) {
    return this.service.update(id, user.id, user.roleCodes.includes('ADMIN'), dto);
  }

  @Get(':id/members')
  @UseGuards(OrganizationGuard)
  members(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() _org: Organization,
  ) {
    return this.service.listMembers(id, user.id, user.roleCodes.includes('ADMIN'));
  }
}

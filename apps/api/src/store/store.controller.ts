import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ExcludeRoles } from '../rbac/decorators/exclude-roles.decorator';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Public } from '../rbac/decorators/public.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreService, type StoreResponse } from './store.service';

@Controller('stores')
export class StoreController {
  constructor(private readonly stores: StoreService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<StoreResponse | null> {
    return this.stores.getMyStore(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ExcludeRoles('ADMIN')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStoreDto): Promise<StoreResponse> {
    // Self-service: a store created from the dashboard is active immediately
    // (createStore grants the SELLER role for ACTIVE stores).
    return this.stores.createStore(user.id, dto, { status: 'ACTIVE' });
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateStoreDto): Promise<StoreResponse> {
    return this.stores.updateStore(user.id, dto);
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string): Promise<StoreResponse | null> {
    return this.stores.getStoreBySlug(slug);
  }
}
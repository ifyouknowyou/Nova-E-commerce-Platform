import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RbacService } from '../rbac/rbac.service';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly rbac: RbacService,
  ) {}

  @Get()
  @RequirePermissions('search.read')
  @ApiOperation({ summary: 'Global search across entities, RBAC- and tenant-scoped.' })
  async search(@Req() req: { user?: AuthenticatedUser }, @Query() qq: { q?: string }) {
    const perms = await this.rbac.getEffectivePermissions(req.user!.orgId, req.user!.userId);
    return this.searchService.search(req.user!.orgId, perms, qq.q ?? '');
  }
}
import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { ObservabilityService } from './observability.service';

@ApiTags('observability')
@Controller('observability')
export class ObservabilityController {
  constructor(private readonly obs: ObservabilityService) {}

  @Get('health')
  @RequirePermissions('observability.read')
  @ApiOperation({ summary: 'Admin health dashboard snapshot (db, uptime, counters, executions).' })
  health(@Req() req: { user?: AuthenticatedUser }) {
    return this.obs.snapshot(req.user!.orgId);
  }

  @Get('errors')
  @RequirePermissions('observability.read')
  @ApiOperation({ summary: 'Recent persisted error records.' })
  errors(@Req() req: { user?: AuthenticatedUser }) {
    return this.obs.errors(req.user!.orgId);
  }

  @Get('metrics')
  @RequirePermissions('observability.read')
  @ApiOperation({ summary: 'Recent metric events.' })
  metrics(@Req() req: { user?: AuthenticatedUser }) {
    return this.obs.metrics(req.user!.orgId);
  }
}
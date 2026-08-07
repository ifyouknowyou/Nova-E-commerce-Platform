import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('kpis')
  @RequirePermissions('dashboard.read')
  @ApiOperation({ summary: 'Live executive KPIs (revenue, expenses, profit, pipeline, forecast).' })
  kpis(@Req() req: { user?: AuthenticatedUser }) {
    return this.dashboard.kpis(req.user!.orgId);
  }

  @Get('bi')
  @RequirePermissions('analytics.read')
  @ApiOperation({ summary: 'BI: revenue-by-month, expenses-by-category, deals-by-stage.' })
  bi(@Req() req: { user?: AuthenticatedUser }) {
    return this.dashboard.bi(req.user!.orgId);
  }
}
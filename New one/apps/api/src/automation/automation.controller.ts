import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiException } from '../common/exceptions';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { AutomationService } from './automation.service';

@ApiTags('automation')
@Controller('automation')
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Get('workflows')
  @RequirePermissions('automation.workflow.read')
  @ApiOperation({ summary: 'List workflows.' })
  list(@Req() req: AutoReq) {
    return this.automation.list(req.user!.orgId);
  }

  @Post('workflows')
  @RequirePermissions('automation.workflow.create')
  @ApiOperation({ summary: 'Create a workflow (trigger/conditions/actions).' })
  create(@Req() req: AutoReq, @Body() body: Record<string, unknown>) {
    return this.automation.create(req.user!.orgId, body);
  }

  @Patch('workflows/:id')
  @RequirePermissions('automation.workflow.update')
  @ApiOperation({ summary: 'Update a workflow (incl. enable/disable).' })
  update(@Req() req: AutoReq, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.automation.update(req.user!.orgId, id, body);
  }

  @Post('workflows/:id/toggle')
  @RequirePermissions('automation.workflow.update')
  @ApiOperation({ summary: 'Enable/disable a workflow.' })
  async toggle(@Req() req: AutoReq, @Param('id') id: string) {
    const list = await this.automation.list(req.user!.orgId);
    const wf = list.find((w) => w.id === id);
    if (!wf) throw new ApiException('NOT_FOUND');
    return this.automation.update(req.user!.orgId, id, { enabled: !wf.enabled });
  }

  @Delete('workflows/:id')
  @RequirePermissions('automation.workflow.delete')
  @ApiOperation({ summary: 'Delete a workflow.' })
  remove(@Req() req: AutoReq, @Param('id') id: string) {
    return this.automation.remove(req.user!.orgId, id);
  }

  @Get('executions')
  @RequirePermissions('automation.execution.read')
  @ApiOperation({ summary: 'Workflow executions log.' })
  executions(@Req() req: AutoReq) {
    return this.automation.executions(req.user!.orgId);
  }
}

interface AutoReq {
  user?: AuthenticatedUser;
}
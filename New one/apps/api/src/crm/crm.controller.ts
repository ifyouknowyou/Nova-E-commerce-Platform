import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DEAL_STAGES, type DealStage } from '@nexus/shared';
import { ApiException } from '../common/exceptions';
import { NotificationsService } from '../hooks/notifications.service';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { CrmService } from './crm.service';

@ApiTags('crm')
@Controller('crm')
export class CrmController {
  constructor(
    private readonly crm: CrmService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Companies ────────────────────────────────────────────────
  @Get('companies')
  @RequirePermissions('crm.company.read')
  @ApiOperation({ summary: 'List companies (paged + search).' })
  companies(@Req() req: ReqWithUser, @Query() q: Record<string, string>) {
    return this.crm.companies(req.user!.orgId, q);
  }

  @Post('companies')
  @RequirePermissions('crm.company.create')
  @ApiOperation({ summary: 'Create a company.' })
  createCompany(@Req() req: ReqWithUser, @Body() body: Record<string, unknown>) {
    return this.crm.createCompany(req.user!.orgId, body);
  }

  @Patch('companies/:id')
  @RequirePermissions('crm.company.update')
  @ApiOperation({ summary: 'Update a company.' })
  updateCompany(@Req() req: ReqWithUser, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.crm.updateCompany(req.user!.orgId, id, body);
  }

  // ── Contacts ─────────────────────────────────────────────────
  @Get('contacts')
  @RequirePermissions('crm.contact.read')
  @ApiOperation({ summary: 'List contacts (paged + search).' })
  contacts(@Req() req: ReqWithUser, @Query() q: Record<string, string>) {
    return this.crm.contacts(req.user!.orgId, q);
  }

  @Post('contacts')
  @RequirePermissions('crm.contact.create')
  @ApiOperation({ summary: 'Create a contact.' })
  createContact(@Req() req: ReqWithUser, @Body() body: Record<string, unknown>) {
    return this.crm.createContact(req.user!.orgId, body);
  }

  // ── Leads ────────────────────────────────────────────────────
  @Get('leads')
  @RequirePermissions('crm.lead.read')
  @ApiOperation({ summary: 'List leads (paged, filter by status).' })
  leads(@Req() req: ReqWithUser, @Query() q: Record<string, string>) {
    return this.crm.leads(req.user!.orgId, q);
  }

  @Post('leads')
  @RequirePermissions('crm.lead.create')
  @ApiOperation({ summary: 'Create a lead.' })
  createLead(@Req() req: ReqWithUser, @Body() body: Record<string, unknown>) {
    return this.crm.createLead(req.user!.orgId, body);
  }

  // ── Deals ────────────────────────────────────────────────────
  @Get('deals')
  @RequirePermissions('crm.deal.read')
  @ApiOperation({ summary: 'List deals (paged, filter by stage).' })
  deals(@Req() req: ReqWithUser, @Query() q: Record<string, string>) {
    return this.crm.deals(req.user!.orgId, q);
  }

  @Post('deals')
  @RequirePermissions('crm.deal.create')
  @ApiOperation({ summary: 'Create a deal.' })
  createDeal(@Req() req: ReqWithUser, @Body() body: Record<string, unknown>) {
    return this.crm.createDeal(req.user!.orgId, body);
  }

  @Post('deals/:id/stage')
  @RequirePermissions('crm.deal.update')
  @ApiOperation({ summary: 'Move a deal through the pipeline (logs an activity, notifies on WON).' })
  async moveDeal(@Req() req: ReqWithUser, @Param('id') id: string, @Body() body: { stage: string }) {
    if (!(DEAL_STAGES as readonly string[]).includes(body.stage)) throw new ApiException('VALIDATION_FAILED');
    const updated = await this.crm.moveDeal(req.user!.orgId, id, req.user!.userId, body.stage as DealStage);
    if (body.stage === 'WON') {
      await this.notifications.notify(req.user!.orgId, {
        userId: updated.ownerId ?? req.user!.userId,
        type: 'SUCCESS', title: 'Deal won 🎉', body: `"${updated.name}" closed.`,
      });
    }
    return updated;
  }

  // ── Activities / notes ───────────────────────────────────────
  @Get('activities')
  @RequirePermissions('crm.activity.read')
  @ApiOperation({ summary: 'List activities (optionally scoped to an entity).' })
  activities(@Req() req: ReqWithUser, @Query() q: Record<string, string>, @Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.crm.activities(req.user!.orgId, q, entityType, entityId);
  }

  @Post('activities')
  @RequirePermissions('crm.activity.create')
  @ApiOperation({ summary: 'Log an activity (call/email/meeting/follow-up).' })
  createActivity(@Req() req: ReqWithUser, @Body() body: Record<string, unknown>) {
    return this.crm.createActivity(req.user!.orgId, body);
  }

  @Get('notes')
  @RequirePermissions('crm.activity.read')
  @ApiOperation({ summary: 'List notes (optionally scoped to an entity).' })
  notes(@Req() req: ReqWithUser, @Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.crm.notes(req.user!.orgId, entityType, entityId);
  }

  @Post('notes')
  @RequirePermissions('crm.activity.create')
  @ApiOperation({ summary: 'Create a note on an entity.' })
  createNote(@Req() req: ReqWithUser, @Body() body: Record<string, unknown>) {
    return this.crm.createNote(req.user!.orgId, body);
  }
}

interface ReqWithUser {
  user?: AuthenticatedUser;
}
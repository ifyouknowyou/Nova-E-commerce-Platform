import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TICKET_STATUSES } from '@nexus/shared';
import { ApiException } from '../common/exceptions';
import { NotificationsService } from '../hooks/notifications.service';
import { RbacService } from '../rbac/rbac.service';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(
    private readonly support: SupportService,
    private readonly rbac: RbacService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('tickets')
  @RequirePermissions('support.ticket.read')
  @ApiOperation({ summary: 'List tickets.' })
  tickets(@Req() req: Req) {
    return this.support.tickets(req.user!.orgId);
  }

  @Post('tickets')
  @RequirePermissions('support.ticket.create')
  @ApiOperation({ summary: 'Create a ticket.' })
  async create(@Req() req: Req, @Body() body: Record<string, unknown>) {
    const ticket = await this.support.createTicket(req.user!.orgId, body);
    if (ticket.assignedToId) {
      await this.notifications.notify(req.user!.orgId, {
        userId: ticket.assignedToId, type: 'INFO', title: 'Ticket assigned', body: ticket.subject as string,
      });
    }
    return ticket;
  }

  @Get('tickets/:id')
  @RequirePermissions('support.ticket.read')
  @ApiOperation({ summary: 'Ticket details + comments (internal notes hidden from non-agents).' })
  async detail(@Req() req: Req, @Param('id') id: string) {
    // Agents (holders of support.ticket.update) see internal notes; others don't.
    const perms = await this.rbac.getEffectivePermissions(req.user!.orgId, req.user!.userId);
    const canSeeInternal = perms.includes('support.ticket.update');
    return this.support.detail(req.user!.orgId, id, canSeeInternal);
  }

  @Post('tickets/:id/status')
  @RequirePermissions('support.ticket.update')
  @ApiOperation({ summary: 'Set a ticket status.' })
  setStatus(@Req() req: Req, @Param('id') id: string, @Body() body: { status: string }) {
    if (!(TICKET_STATUSES as readonly string[]).includes(body.status)) throw new ApiException('VALIDATION_FAILED');
    return this.support.setStatus(req.user!.orgId, id, body.status);
  }

  @Post('tickets/:id/assign')
  @RequirePermissions('support.ticket.update')
  @ApiOperation({ summary: 'Assign (or unassign with null) a ticket.' })
  assign(@Req() req: Req, @Param('id') id: string, @Body() body: { assignedToId: string | null }) {
    return this.support.assign(req.user!.orgId, id, body.assignedToId ?? null);
  }

  @Post('tickets/:id/comments')
  @RequirePermissions('support.comment.create')
  @ApiOperation({ summary: 'Add a comment; internal notes only for agents.' })
  async addComment(@Req() req: Req, @Param('id') id: string, @Body() body: { body: string; internal?: boolean }) {
    const wantInternal = Boolean(body.internal);
    if (wantInternal) {
      const perms = await this.rbac.getEffectivePermissions(req.user!.orgId, req.user!.userId);
      if (!perms.includes('support.ticket.update')) throw new ApiException('FORBIDDEN');
    }
    return this.support.addComment(req.user!.orgId, {
      ticketId: id, authorId: req.user!.userId, body: body.body, internal: wantInternal,
    });
  }
}

interface Req {
  user?: AuthenticatedUser;
}
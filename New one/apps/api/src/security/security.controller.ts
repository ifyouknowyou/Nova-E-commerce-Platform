import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiException } from '../common/exceptions';
import { PrismaService } from '../prisma/prisma.service';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import { AuthenticatedUser } from '../tenant/session.types';
import { SessionService } from './session.service';
import { SecurityEventsService } from './security-events.service';

@ApiTags('security')
@Controller('security')
export class SecurityController {
  constructor(
    private readonly sessions: SessionService,
    private readonly events: SecurityEventsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('sessions')
  @ApiOperation({ summary: 'List the authenticated user’s sessions in this org.' })
  async sessionsList(@Req() req: { user?: AuthenticatedUser }) {
    const user = req.user!;
    return this.sessions.listActive(user.orgId, user.userId);
  }

  @Post('sessions/:id/revoke')
  @RequirePermissions('iam.members.update')
  @ApiOperation({ summary: 'Revoke a session (only own sessions unless admin).' })
  async revokeSession(@Req() req: { user?: AuthenticatedUser }, @Param('id') id: string) {
    const user = req.user!;
    const session = await this.prisma.withTenant(user.orgId, (tx) =>
      tx.session.findFirst({ where: { id, orgId: user.orgId } }),
    );
    if (!session) throw new ApiException('NOT_FOUND');
    // Self-session always allowed; others need iam.members.update (already enforced).
    if (session.userId !== user.userId) throw new ApiException('FORBIDDEN');
    await this.sessions.revoke(id);
    await this.events.record(user.orgId, 'SESSION_REVOKED', { userId: user.userId });
    return { ok: true };
  }

  @Get('events')
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Tenant-scoped security event feed (login history).' })
  eventsList(@Req() req: { user?: AuthenticatedUser }) {
    const user = req.user!;
    return this.events.list(user.orgId, user.userId);
  }

  @Get('policy')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Return the org’s effective password policy.' })
  async policy(@Req() req: { user?: AuthenticatedUser }) {
    const user = req.user!;
    const settings = await this.prisma.withTenant(user.orgId, (tx) =>
      tx.setting.findMany({
        where: { orgId: user.orgId, key: { startsWith: 'security.password.' } },
        select: { key: true, value: true },
      }),
    );
    const out: Record<string, unknown> = {};
    for (const s of settings) out[s.key.replace('security.password.', '')] = s.value;
    return { policy: out };
  }
}

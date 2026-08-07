import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions('notification.read')
  @ApiOperation({ summary: 'My notifications (unread first).' })
  mine(@Req() req: { user?: AuthenticatedUser }) {
    const user = req.user!;
    return this.prisma.withTenant(user.orgId, (tx) =>
      tx.notification.findMany({
        where: { orgId: user.orgId, userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
  }

  @Post(':id/read')
  @RequirePermissions('notification.update')
  @ApiOperation({ summary: 'Mark one notification read.' })
  read(@Req() req: { user?: AuthenticatedUser }, @Param('id') id: string) {
    const user = req.user!;
    return this.prisma.withTenant(user.orgId, (tx) =>
      tx.notification.updateMany({ where: { id, orgId: user.orgId, userId: user.userId }, data: { readAt: new Date() } }),
    );
  }

  @Post('read-all')
  @RequirePermissions('notification.update')
  @ApiOperation({ summary: 'Mark all my notifications read.' })
  readAll(@Req() req: { user?: AuthenticatedUser }) {
    const user = req.user!;
    return this.prisma.withTenant(user.orgId, (tx) =>
      tx.notification.updateMany({ where: { orgId: user.orgId, userId: user.userId, readAt: null }, data: { readAt: new Date() } }),
    );
  }
}
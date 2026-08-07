import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from '../hooks/audit.service';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermissions('audit.read')
  @ApiOperation({ summary: 'Query the tenant audit trail.' })
  list(@Req() req: { user?: AuthenticatedUser }, @Query() q: { page?: string; pageSize?: string; entity?: string; action?: string; actorId?: string }) {
    return this.audit.list(req.user!.orgId, {
      page: Number(q.page ?? 1),
      pageSize: Number(q.pageSize ?? 50),
      entity: q.entity,
      action: q.action,
      actorId: q.actorId,
    });
  }
}
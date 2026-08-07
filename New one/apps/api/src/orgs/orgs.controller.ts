import { Body, Controller, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleCode, isRoleCode } from '@nexus/shared';
import { AuthService } from '../auth/auth.service';
import { setSessionCookies } from '../common/cookies';
import { ApiException } from '../common/exceptions';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { OrgsService } from './orgs.service';

interface RequestWithUser {
  user?: AuthenticatedUser;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

function metaFrom(req: RequestWithUser) {
  const ua = req.headers['user-agent'];
  return { ip: req.ip, userAgent: Array.isArray(ua) ? ua[0] : ua };
}

@ApiTags('orgs')
@Controller('orgs')
export class OrgsController {
  constructor(
    private readonly orgs: OrgsService,
    private readonly auth: AuthService,
  ) {}

  @Get('current')
  @RequirePermissions('org.read')
  @ApiOperation({ summary: 'Return the current organization profile.' })
  current(@Req() req: RequestWithUser) {
    return this.orgs.current(req.user!.orgId);
  }

  @Patch('current')
  @RequirePermissions('org.update')
  @ApiOperation({ summary: 'Update the current organization profile.' })
  update(@Req() req: RequestWithUser, @Body() body: { name?: string; plan?: string }) {
    return this.orgs.update(req.user!.orgId, body);
  }

  @Get('members')
  @RequirePermissions('iam.members.read')
  @ApiOperation({ summary: 'List the current org’s members and their roles.' })
  members(@Req() req: RequestWithUser) {
    return this.orgs.members(req.user!.orgId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Organizations the user belongs to (for the switcher).' })
  my(@Req() req: RequestWithUser) {
    return this.orgs.myOrgs(req.user!.userId);
  }

  @Get('current/me')
  @ApiOperation({ summary: 'The user’s membership identity in the current org.' })
  currentMe(@Req() req: RequestWithUser) {
    const user = req.user!;
    return { userId: user.userId, orgId: user.orgId, roles: user.roles };
  }

  @Post('members/invite')
  @RequirePermissions('iam.members.invite')
  @ApiOperation({ summary: 'Invite a member by email with a role.' })
  invite(@Req() req: RequestWithUser, @Body() body: { email: string; roleCode: RoleCode }) {
    if (!isRoleCode(body.roleCode)) throw new ApiException('VALIDATION_FAILED');
    return this.orgs.invite(req.user!.orgId, req.user!.userId, { email: body.email, roleCode: body.roleCode });
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept an invite by its one-time token.' })
  async acceptInvite(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: Response, @Param('token') token: string) {
    const user = req.user!;
    // re-issue a session for the newly joined org so the next request is tenant-scoped.
    const membership = await this.orgs.acceptInvite(token, user.userId);
    const session = await this.auth.switchOrg(user.userId, membership.orgId, metaFrom(req));
    setSessionCookies(res, session.accessToken, session.refreshToken, session.csrf);
    return { ok: true, orgId: membership.orgId };
  }

  @Post('switch')
  @ApiOperation({ summary: 'Switch the active tenant org (re-issues session cookies).' })
  async switchOrg(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: Response, @Body() body: { orgId: string }) {
    const user = req.user!;
    const session = await this.auth.switchOrg(user.userId, body.orgId, metaFrom(req));
    setSessionCookies(res, session.accessToken, session.refreshToken, session.csrf);
    return { ok: true, orgId: body.orgId };
  }
}
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_COOKIE, SessionClaim } from '@nexus/shared';
import { ApiException } from '../../common/exceptions';
import { AuthenticatedUser } from '../../tenant/session.types';
import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from '../decorators/rbac.decorators';
import { RbacService } from '../rbac.service';

/**
 * THE single reusable guard (upgrade Decision 3). Registered globally; used by
 * every protected route with zero per-route glue.
 *
 *   1. @Public routes pass through untouched.
 *   2. Otherwise the access token is read from the httpOnly cookie first, then
 *      the Authorization: Bearer header — the tenant claim (orgId) becomes the
 *      request principal. No claim => fail closed (AUTH_NO_TENANT).
 *   3. If the handler declares @RequirePermissions(...), the member's effective
 *      org-scoped permissions are resolved from the DB (inside RLS) and checked
 *      ALL-or-nothing. Missing => FORBIDDEN.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context
      .switchToHttp()
      .getRequest<{
        user?: AuthenticatedUser;
        cookies?: Record<string, string>;
        headers: Record<string, string | string[] | undefined>;
      }>();

    const token = this.extractToken(req);
    if (!token) throw new ApiException('AUTH_UNAUTHENTICATED');

    let claims: SessionClaim;
    try {
      claims = await this.jwtService.verifyAsync<SessionClaim>(token);
    } catch {
      throw new ApiException('AUTH_UNAUTHENTICATED');
    }

    if (!claims.orgId) throw new ApiException('AUTH_NO_TENANT');

    req.user = {
      userId: claims.userId,
      orgId: claims.orgId,
      roles: claims.roles ?? [],
      email: '',
      emailVerified: false,
    };

    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const effective = await this.rbac.getEffectivePermissions(claims.orgId, claims.userId);
    const missing = required.filter((p) => !effective.includes(p));
    if (missing.length > 0) {
      this.logger.warn(
        `RBAC denied user=${claims.userId} org=${claims.orgId} missing=${missing.join(',')} required=${required.join(',')}`,
      );
      throw new ApiException('FORBIDDEN');
    }
    return true;
  }

  private extractToken(req: {
    cookies?: Record<string, string>;
    headers: Record<string, string | string[] | undefined>;
  }): string | undefined {
    const cookie = req.cookies?.[ACCESS_COOKIE];
    if (cookie) return cookie;

    const header = req.headers['authorization'];
    if (!header) return undefined;
    const value = Array.isArray(header) ? (header[0] ?? undefined) : header;
    const match = /^Bearer\s+(.+)$/i.exec(value ?? '');
    return match?.[1];
  }
}

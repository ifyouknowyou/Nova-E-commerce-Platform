import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_COOKIE, CSRF_COOKIE, CSRF_HEADER } from '@nexus/shared';
import { ApiException } from './exceptions';
import { CsrfService } from './csrf.service';
import { IS_PUBLIC_KEY } from '../rbac/decorators/rbac.decorators';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection for cookie-authenticated state-changing requests.
 * The client echoes the CSRF cookie value (readable by JS) in `x-csrf-token`;
 * the guard recomputes the expected HMAC from the verified access JWT and
 * compares constant-time. Public routes and Bearer-token requests (no cookie)
 * are exempt — CSRF only applies to cookie sessions.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly csrf: CsrfService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<{
      method: string;
      cookies?: Record<string, string>;
      headers: Record<string, string | string[] | undefined>;
    }>();

    if (SAFE_METHODS.has(req.method)) return true;

    const accessToken = req.cookies?.[ACCESS_COOKIE];
    // Not cookie-authenticated (e.g. Bearer API client) → no CSRF requirement.
    if (!accessToken) return true;

    let userId: string;
    try {
      const payload = this.jwtService.verify<{ userId: string }>(accessToken);
      userId = payload.userId;
    } catch {
      // Invalid access cookie — let the auth guard produce the canonical 401.
      return true;
    }

    const csrfCookie = req.cookies?.[CSRF_COOKIE];
    const header = req.headers[CSRF_HEADER];
    const token = Array.isArray(header) ? header[0] : header;

    if (!csrfCookie || csrfCookie !== token || !this.csrf.verify(userId, token)) {
      throw new ApiException('CSRF_INVALID');
    }
    return true;
  }
}

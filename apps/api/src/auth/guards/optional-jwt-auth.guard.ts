import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { ACCESS_COOKIE, parseCookies } from '../cookies';

/**
 * Authenticates when a valid token is present (httpOnly cookie or Bearer
 * header); otherwise allows the request to proceed as anonymous. Used by
 * guest-capable endpoints (cart) so logged-in users are recognized while
 * anonymous visitors still work.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt-access') {
  override canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    // The app authenticates via the httpOnly access cookie, not a Bearer
    // header — check both so cookie-authed users aren't mistaken for guests.
    const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(request as never);
    const cookieToken = parseCookies(request.headers.cookie)[ACCESS_COOKIE];
    if (!bearer && !cookieToken) return true; // anonymous
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  override handleRequest<TUser = unknown>(err: unknown, user: TUser | false): TUser | null {
    if (err || !user) return null;
    return user;
  }
}

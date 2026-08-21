import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CSRF_COOKIE, parseCookies } from '../cookies';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Double-submit CSRF protection. SameSite=Lax already stops cross-site cookie
 * sending for state-changing requests; this adds defense-in-depth for any
 * cookie-authenticated mutation. It only enforces when the request carries our
 * CSRF cookie (i.e. cookie-based auth). Bearer-token clients (curl, tests) are
 * unaffected — bearer tokens are not auto-attached by browsers, so CSRF does
 * not apply to them.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ method: string; headers: Record<string, string> }>();
    if (!UNSAFE_METHODS.has(req.method.toUpperCase())) return true;

    const cookies = parseCookies(req.headers.cookie);
    const csrfCookie = cookies[CSRF_COOKIE];
    if (!csrfCookie) return true; // not cookie-authenticated

    const header = req.headers['x-csrf-token'];
    if (!header || header !== csrfCookie) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return true;
  }
}

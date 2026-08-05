import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';

/**
 * Authenticates when a valid bearer token is present; otherwise allows the
 * request to proceed as anonymous. Used by guest-capable endpoints (cart).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt-access') {
  override canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request as never);
    if (!token) return true; // anonymous
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  override handleRequest<TUser = unknown>(err: unknown, user: TUser | false): TUser | null {
    if (err || !user) return null;
    return user;
  }
}

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { RoleCode } from '@nova/shared';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { CONFIG, type AppConfig } from '../../config/configuration';
import { ACCESS_COOKIE, parseCookies } from '../cookies';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../rbac/rbac.types';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  roleCodes: RoleCode[];
  /** User.tokenVersion at issuance — bumped to revoke access on security events. */
  tokenVersion: number;
  jti: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    @Inject(CONFIG) config: AppConfig,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Access token comes from the httpOnly cookie (cookie-based auth) or the
      // Authorization Bearer header (API tools / backwards compatibility).
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => parseCookies(req.headers.cookie)[ACCESS_COOKIE] || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.jwtAccessSecret,
    });
  }

  /**
   * Revalidate the principal against the database on every request, not just
   * the signed token: a banned/suspended/deleted account, or a token issued
   * before a password change / logout-all (tokenVersion mismatch), is rejected
   * immediately regardless of the token's remaining lifetime.
   */
  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub) throw new UnauthorizedException('Invalid token payload');

    const user = await this.prisma.db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, status: true, deletedAt: true, tokenVersion: true },
    });
    if (!user || user.deletedAt) throw new UnauthorizedException('Account unavailable');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');
    if (typeof payload.tokenVersion !== 'number' || payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Session has been revoked, please sign in again');
    }

    return {
      id: user.id,
      email: user.email,
      roleCodes: payload.roleCodes ?? [],
    };
  }
}
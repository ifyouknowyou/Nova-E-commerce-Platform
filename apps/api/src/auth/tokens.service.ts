import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { RoleCode } from '@nova/shared';
import { CONFIG, type AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { JwtAccessPayload } from './strategies/jwt-access.strategy';

export interface RefreshSession {
  userId: string;
  createdAt: string;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function refreshKey(token: string): string {
  return `refresh:${sha256(token)}`;
}

@Injectable()
export class TokensService {
  constructor(
    @Inject(CONFIG) private readonly config: AppConfig,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Invalidate every previously-issued access token for a user by bumping their
   * tokenVersion (the JWT strategy rejects tokens whose version no longer
   * matches). Call on password change / reset, logout-all, and ban/suspend.
   */
  async bumpTokenVersion(userId: string): Promise<void> {
    await this.prisma.db.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async issueAccessToken(
    userId: string,
    email: string,
    roleCodes: RoleCode[],
    tokenVersion: number,
  ): Promise<string> {
    const payload: JwtAccessPayload = { sub: userId, email, roleCodes, tokenVersion, jti: randomUUID() };
    // Enforce an expiry so a leaked access token is not valid forever. The TTL is
    // a validated string like "15m"; jsonwebtoken expects a StringValue-templated
    // type, so it is cast here.
    const ttl = this.config.jwtAccessTtl as `${number}${'s' | 'm' | 'h' | 'd'}`;
    return this.jwt.signAsync(payload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: ttl,
    });
  }

  /** Create a new refresh session in Redis and return the opaque token. */
  async createRefreshSession(userId: string, rememberMe: boolean): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    const session: RefreshSession = { userId, createdAt: new Date().toISOString() };
    // "Remember me" = long-lived session; otherwise the session is short-lived.
    const ttl = this.ttlSeconds(this.config.jwtRefreshTtl, this.config.jwtSessionTtl, rememberMe);
    await this.redis.set(refreshKey(token), session, ttl);
    return token;
  }

  async verify(refreshToken: string): Promise<RefreshSession> {
    const session = await this.redis.get<RefreshSession>(refreshKey(refreshToken));
    if (!session) throw new UnauthorizedException('Invalid or expired refresh token');
    return session;
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.redis.del(refreshKey(refreshToken));
  }

  /** Revoke every refresh session belonging to a user (logout-all / password change). */
  async revokeAllForUser(userId: string): Promise<void> {
    const keys = await this.redis.scanKeys('refresh:*');
    for (const key of keys) {
      const session = await this.redis.get<RefreshSession>(key);
      if (session?.userId === userId) await this.redis.del(key);
    }
  }

  private ttlSeconds(refreshTtl: string, sessionTtl: string, rememberMe: boolean): number {
    return this.parseTtl(rememberMe ? refreshTtl : sessionTtl);
  }

  private parseTtl(ttl: string): number {
    const match = /^(\d+)([smhd])?$/.exec(ttl.trim());
    if (!match) return 24 * 3600;
    const value = Number(match[1]);
    switch (match[2]) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return value;
    }
  }
}

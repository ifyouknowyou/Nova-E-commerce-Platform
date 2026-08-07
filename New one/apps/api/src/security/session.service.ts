import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_TOKEN_TTL_DAYS } from '@nexus/shared';

export interface NewRefreshSession {
  /** Opaque refresh token the client stores (the session's id). */
  token: string;
  expiresAt: Date;
}

/**
 * Refresh-session lifecycle. Refresh tokens are stored server-side (a `Session`
 * row whose id IS the token — high-entropy uuid, revocable, rotatable).
 * Sign-in/refresh call `create()`; sign-out/revoke call `revoke()`.
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a refresh session for a user within an org. Returns the token. */
  async create(userId: string, orgId: string, ip?: string, userAgent?: string): Promise<NewRefreshSession> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    // Session is tenant-scoped; create under the org context (RLS permits it).
    await this.prisma.withTenant(orgId, (tx) =>
      tx.session.create({
        data: { id: token, userId, orgId, status: 'ACTIVE', ip, userAgent, expiresAt },
      }),
    );
    return { token, expiresAt };
  }

  /** Rotate: revoke the old token and mint a new one (detects replay). */
  async rotate(
    oldToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<NewRefreshSession | null> {
    let session:
      | { id: string; userId: string; orgId: string; status: string; expiresAt: Date }
      | null = null;

    // Lookup + revoke inside the org context is impossible without knowing orgId,
    // so resolve the session by id (session id is global), then scope revoke+create
    // by the org we discover. RLS still protects the row from other tenants.
    const found = await this.prisma.client.session.findUnique({ where: { id: oldToken } });
    if (!found) return null;
    session = found;
    if (session.status !== 'ACTIVE') return null;
    if (session.expiresAt.getTime() < Date.now()) return null;

    await this.prisma.withTenant(session.orgId, (tx) =>
      tx.session.update({ where: { id: oldToken }, data: { status: 'REVOKED', revokedAt: new Date() } }),
    );

    return this.create(session.userId, session.orgId, ip, userAgent);
  }

  /** Revoke a refresh session by token. Returns whether it existed. */
  async revoke(token: string): Promise<boolean> {
    const found = await this.prisma.client.session.findUnique({ where: { id: token } });
    if (!found) return false;
    await this.prisma.withTenant(found.orgId, (tx) =>
      tx.session.update({
        where: { id: token },
        data: { status: 'REVOKED', revokedAt: new Date() },
      }),
    );
    return true;
  }

  /** List a user's sessions within an org (active first). */
  async listActive(orgId: string, userId: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.session.findMany({
        where: { orgId, userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, ip: true, userAgent: true, createdAt: true, expiresAt: true },
      }),
    );
  }
}

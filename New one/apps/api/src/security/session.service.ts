import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_TOKEN_TTL_DAYS } from '@nexus/shared';

export interface NewRefreshSession {
  /** Opaque refresh token the client stores (the session's id). */
  token: string;
  expiresAt: Date;
}

/** Rotated session: new token + the discovered user/org so callers skip an RLS-hidden re-lookup. */
export interface RotatedSession extends NewRefreshSession {
  userId: string;
  orgId: string;
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
  ): Promise<RotatedSession | null> {
    let session:
      | { id: string; userId: string; orgId: string; status: string; expiresAt: Date }
      | null = null;

    // Lookup + revoke inside the org context is impossible without knowing orgId,
    // so resolve the session by id (session id is global), then scope revoke+create
    // by the org we discover. `sessions` is RLS-scoped to app.org, so the id lookup
    // runs under the session_token_lookup policy (app.session_token), which exposes
    // a row only to the caller holding that exact refresh token.
    const found = await this.lookupByToken(oldToken);
    if (!found) return null;
    session = found;
    if (session.status !== 'ACTIVE') return null;
    if (session.expiresAt.getTime() < Date.now()) return null;

    await this.prisma.withTenant(session.orgId, (tx) =>
      tx.session.update({ where: { id: oldToken }, data: { status: 'REVOKED', revokedAt: new Date() } }),
    );

    const next = await this.create(session.userId, session.orgId, ip, userAgent);
    return { ...next, userId: session.userId, orgId: session.orgId };
  }

  /**
   * Resolve a Session row by its raw id (the refresh token) on a public route
   * where no org claim exists yet. Runs with app.session_token set so the
   * session_token_lookup policy reveals exactly this row — RLS stays fail-closed
   * for any other caller.
   */
  private async lookupByToken(token: string) {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.session_token', ${token}, true)`;
      return tx.session.findUnique({ where: { id: token } });
    });
  }

  /** Revoke a refresh session by token. Returns the revoked row (null if none). */
  async revoke(token: string): Promise<{ id: string; userId: string; orgId: string } | null> {
    const found = await this.lookupByToken(token);
    if (!found) return null;
    await this.prisma.withTenant(found.orgId, (tx) =>
      tx.session.update({
        where: { id: token },
        data: { status: 'REVOKED', revokedAt: new Date() },
      }),
    );
    return { id: found.id, userId: found.userId, orgId: found.orgId };
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

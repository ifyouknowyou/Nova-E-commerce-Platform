import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { VerificationTokenType } from '@nexus/shared';
import { withUserContext } from '@nexus/db';
import { PrismaService } from '../prisma/prisma.service';

const TOKEN_TTL = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000, // 1h
  INVITE_ACCEPT: 7 * 24 * 60 * 60 * 1000, // 7d
} as const;

/**
 * One-time verification tokens (email verify / password reset / invite accept).
 * Only the SHA-256 hash is stored; the raw token is returned once to be emailed.
 * All reads/writes are user-scoped (RLS `self_own_tokens` on app.user_id).
 */
@Injectable()
export class TokensService {
  constructor(private readonly prisma: PrismaService) {}

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Create a token for a user. Returns the RAW token (email it). */
  async issue(userId: string, type: VerificationTokenType): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TOKEN_TTL[type]);
    await withUserContext(userId, (tx) =>
      tx.verificationToken.create({
        data: { userId, type, tokenHash: this.hash(raw), expiresAt },
      }),
    );
    return raw;
  }

  /** Redeem a raw token. Returns the matching row or null (used/invalid/expired). */
  async redeem(raw: string, type: VerificationTokenType) {
    const hash = this.hash(raw);

    // Public routes have no user claim; the token lookup is allowed by the
    // unguessable-hash policy (app.verify_token), then used within user scope.
    const token = await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.verify_token', ${hash}, true)`;
      return tx.verificationToken.findUnique({ where: { tokenHash: hash } });
    });

    if (!token || token.type !== type) return null;
    if (token.usedAt) return null;
    if (token.expiresAt.getTime() < Date.now()) return null;

    await withUserContext(token.userId, (tx) =>
      tx.verificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    );
    return token;
  }
}

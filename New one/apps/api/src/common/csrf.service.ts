import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless CSRF tokens (double-submit bound to the authenticated user).
 * Value = HMAC-SHA256(secret, "csrf:" + userId). The server recomputes from the
 * JWT it verified; no session store needed. Constant-time compare.
 */
@Injectable()
export class CsrfService {
  constructor(private readonly secret: string) {}

  mint(userId: string): string {
    return createHmac('sha256', this.secret).update(`csrf:${userId}`).digest('base64url');
  }

  verify(userId: string, token: string | undefined): boolean {
    if (!token) return false;
    const expected = this.mint(userId);
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
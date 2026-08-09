import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomInt, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import type { User } from '@nova/db';
import { CONFIG, type AppConfig } from '../config/configuration';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { RedisService } from '../redis/redis.service';
import { StoreService } from '../store/store.service';
import { RegisterDto } from './dto/register.dto';
import { TokensService } from './tokens.service';

const VERIFY_CODE_TTL_MS = 30 * 60 * 1000; // verification code valid for 30 minutes
const RESET_TTL_SECONDS = 3600;

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  emailVerified: boolean;
  roles: string[];
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
  /** Whether this session is long-lived ("remember me") — used for cookie TTLs. */
  rememberMe: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(CONFIG) private readonly config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokens: TokensService,
    private readonly rbac: RbacService,
    private readonly mail: MailService,
    private readonly stores: StoreService,
  ) {}

  // ── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    const existing = await this.prisma.db.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Registration failed. Please try again.');

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const user = await this.prisma.db.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        rememberMe: dto.rememberMe ?? false,
      },
    });
    if (dto.accountType === 'SELLER') {
      if (!dto.storeName) {
        throw new BadRequestException('A store name is required for seller accounts');
      }
      // Self-service seller signup: grant SELLER + create an active store in
      // one step (createStore assigns the role for ACTIVE stores).
      await this.stores.createStore(user.id, { name: dto.storeName }, { status: 'ACTIVE' });
    } else {
      await this.rbac.assignRole(user.id, 'CUSTOMER');
    }

    const code = await this.setVerificationCode(user.id);
    await this.mail.sendVerificationEmail(user.email, code, user.name ?? '');

    return { message: 'Registration successful. Check your email for a verification code.', email: user.email };
  }

  /** Verify a 6-digit code. The code is matched against the DB and cleared on success. */
  async verifyEmail(code: string): Promise<{ message: string }> {
    const user = await this.prisma.db.user.findFirst({
      where: {
        emailVerificationCode: code,
        emailVerifiedAt: null,
        emailVerificationExpiresAt: { gt: new Date() },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid or expired verification code');

    await this.prisma.db.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), emailVerificationCode: null, emailVerificationExpiresAt: null },
    });
    await this.mail.sendWelcomeEmail(user.email, user.name ?? '');

    return { message: 'Email verified. You can now sign in.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.db.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) return { message: 'If the account exists, a verification email has been sent.' };

    const code = await this.setVerificationCode(user.id);
    await this.mail.sendVerificationEmail(user.email, code, user.name ?? '');
    return { message: 'Verification email sent.' };
  }

  // ── Login / refresh / logout ──────────────────────────────────────────────

  async login(email: string, password: string, rememberMe: boolean): Promise<AuthResult> {
    const user = await this.prisma.db.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      // Same error for unknown email and wrong password (avoid user enumeration).
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before signing in.' });
    }
    if (!this.isOperational(user)) {
      throw new UnauthorizedException('Account is unavailable');
    }

    await this.prisma.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), rememberMe },
    });

    const roles = await this.rbac.getRolesForUser(user.id);
    const accessToken = await this.tokens.issueAccessToken(user.id, user.email, roles, user.tokenVersion);
    const refreshToken = await this.tokens.createRefreshSession(user.id, rememberMe);

    return { accessToken, refreshToken, user: this.toUserResponse(user, roles), rememberMe };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const session = await this.tokens.verify(refreshToken);
    const user = await this.prisma.db.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.emailVerifiedAt || !this.isOperational(user)) {
      throw new UnauthorizedException('Account unavailable');
    }

    // Rotate: revoke old, mint new.
    await this.tokens.revoke(refreshToken);
    const roles = await this.rbac.getRolesForUser(user.id);
    const accessToken = await this.tokens.issueAccessToken(user.id, user.email, roles, user.tokenVersion);
    const nextRefresh = await this.tokens.createRefreshSession(user.id, user.rememberMe);

    return { accessToken, refreshToken: nextRefresh, user: this.toUserResponse(user, roles), rememberMe: user.rememberMe };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.tokens.revoke(refreshToken);
    return { message: 'Signed out' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.tokens.revokeAllForUser(userId);
    // Also invalidate every access token so "sign out everywhere" is effective.
    await this.tokens.bumpTokenVersion(userId);
    return { message: 'Signed out everywhere' };
  }

  // ── Password reset ────────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.db.user.findUnique({ where: { email } });
    if (user && user.passwordHash) {
      const token = randomBytes(32).toString('base64url');
      await this.redis.set(this.resetKey(token), user.id, RESET_TTL_SECONDS);
      await this.mail.sendPasswordResetEmail(user.email, token, user.name ?? '');
    }
    // Always succeed — prevents account enumeration.
    return { message: 'If the account exists, a password reset email has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const userId = await this.redis.get<string>(this.resetKey(token));
    if (!userId) throw new UnauthorizedException('Invalid or expired reset token');

    const user = await this.prisma.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account not found');

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.db.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.redis.del(this.resetKey(token));
    await this.tokens.revokeAllForUser(userId);
    // Access tokens issued before the reset are no longer valid.
    await this.tokens.bumpTokenVersion(userId);
    await this.mail.sendPasswordChangedEmail(user.email);

    return { message: 'Password updated. You can now sign in.' };
  }

  /** Change the password for a signed-in user (requires the current password). */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account not found');

    if (!user.passwordHash) {
      throw new BadRequestException('This account signs in with Google and has no password to change');
    }

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.db.user.update({ where: { id: userId }, data: { passwordHash } });
    // Invalidate every refresh session AND every issued access token so a leaked
    // session cannot persist after the password changes.
    await this.tokens.revokeAllForUser(userId);
    await this.tokens.bumpTokenVersion(userId);
    await this.prisma.db.auditLog.create({
      data: { userId, action: 'auth.change_password', entityType: 'user', entityId: userId },
    });
    await this.mail.sendPasswordChangedEmail(user.email);

    return { message: 'Password changed. Please sign in again.' };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  async googleLogin(profile: { id: string; email: string; name: string; avatarUrl?: string }): Promise<AuthResult> {
    let user = await this.prisma.db.user.findUnique({ where: { googleId: profile.id } });
    if (!user) user = await this.prisma.db.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      user = await this.prisma.db.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          googleId: profile.id,
          avatarKey: profile.avatarUrl,
          emailVerifiedAt: new Date(), // Google has verified this address
        },
      });
      await this.rbac.assignRole(user.id, 'CUSTOMER');
    } else {
      if (!this.isOperational(user)) throw new UnauthorizedException('Account is unavailable');
      if (!user.googleId && !user.emailVerifiedAt) {
        // Only bind Google to an already-verified account. Otherwise an attacker
        // who controls a Google address matching an unverified signup could take
        // it over by impersonating the email.
        throw new UnauthorizedException('Verify your email address before linking Google sign-in');
      }
      if (!user.googleId) {
        user = await this.prisma.db.user.update({ where: { id: user.id }, data: { googleId: profile.id } });
      }
    }

    const roles = await this.rbac.getRolesForUser(user.id);
    const refreshed = await this.prisma.db.user.findUnique({ where: { id: user.id } });
    if (!refreshed) throw new UnauthorizedException('Account unavailable');
    const accessToken = await this.tokens.issueAccessToken(user.id, user.email, roles, refreshed.tokenVersion);
    const refreshToken = await this.tokens.createRefreshSession(user.id, true);

    return { accessToken, refreshToken, user: this.toUserResponse(refreshed, roles), rememberMe: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Reset tokens are stored hashed at rest (like refresh tokens), never raw. */
  private resetKey(token: string): string {
    return `reset:${createHash('sha256').update(token).digest('hex')}`;
  }

  /** Generate a 6-digit code, persist it (with expiry) on the user's row, and return it. */
  private async setVerificationCode(userId: string): Promise<string> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.db.user.update({
      where: { id: userId },
      data: {
        emailVerificationCode: code,
        emailVerificationExpiresAt: new Date(Date.now() + VERIFY_CODE_TTL_MS),
      },
    });
    return code;
  }

  /** An account may sign in / keep sessions only while ACTIVE and not deleted. */
  private isOperational(user: Pick<User, 'status' | 'deletedAt'>): boolean {
    return user.status === 'ACTIVE' && user.deletedAt === null;
  }

  private toUserResponse(user: User, roles: string[]): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerifiedAt !== null,
      roles,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { withTenant, withUserContext } from '@nexus/db';
import { compare, hash } from 'bcryptjs';
import {
  PASSWORD_POLICY,
  SessionClaim,
  validatePassword,
} from '@nexus/shared';
import { ApiException } from '../common/exceptions';
import { CsrfService } from '../common/csrf.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from '../security/session.service';
import { SecurityEventsService } from '../security/security-events.service';
import { TokensService } from './tokens.service';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export interface SessionResult {
  user: SessionClaim;
  accessToken: string;
  refreshToken: string;
  csrf: string;
}

const WEB_BASE = process.env.WEB_URL ?? 'http://localhost:3000';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly events: SecurityEventsService,
    private readonly tokens: TokensService,
    private readonly mail: MailService,
    private readonly csrf: CsrfService,
  ) {}

  /** Build the access JWT + refresh session + CSRF for a member. */
  private async buildSession(userId: string, orgId: string, roles: string[], meta: RequestMeta): Promise<SessionResult> {
    const { token: refreshToken } = await this.sessionService.create(userId, orgId, meta.ip, meta.userAgent);

    const claims: SessionClaim = { userId, orgId, roles };
    const accessToken = await this.jwtService.signAsync(claims);

    return { user: claims, accessToken, refreshToken, csrf: this.csrf.mint(userId) };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Sign-up / sign-in / sign-out / refresh
  // ─────────────────────────────────────────────────────────────────────────────

  async signUp(input: { name: string; email: string; password: string; orgName?: string; orgSlug?: string }, meta: RequestMeta): Promise<SessionResult> {
    const email = input.email.toLowerCase().trim();
    const passwordErrors = validatePassword(input.password, PASSWORD_POLICY);
    if (passwordErrors.length) throw new ApiException('AUTH_PASSWORD_WEAK', { errors: passwordErrors });

    const existing = await this.prisma.client.user.findUnique({ where: { email } });
    if (existing) throw new ApiException('AUTH_EMAIL_TAKEN');

    const passwordHash = await hash(input.password, 10);
    const orgSlug =
      input.orgSlug ??
      ((input.orgName ?? 'My Organization').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40) || 'my-org');

    // Create the user, their org, and an OWNER membership as one flow.
    // The org row is platform-scoped (no RLS); once it exists we set the tenant
    // claim so the tenant-scoped inserts (membership/roles/settings) pass RLS.
    const result = await this.prisma.client.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, name: input.name, passwordHash } });
      const org = await tx.organization.create({ data: { name: input.orgName ?? `${input.name}'s Org`, slug: orgSlug } });
      await tx.$executeRaw`SELECT set_config('app.org', ${org.id}, true)`;
      const member = await tx.organizationMember.create({ data: { orgId: org.id, userId: user.id, status: 'ACTIVE' } });
      const ownerRole = await tx.role.create({
        data: { orgId: org.id, code: 'OWNER', name: 'Owner', isSystem: true },
      });
      await tx.membershipRole.create({ data: { memberId: member.id, roleId: ownerRole.id } });
      // Seed the default password-policy settings for the new org.
      await tx.setting.createMany({
        data: [
          { orgId: org.id, key: 'security.password.minLength', value: PASSWORD_POLICY.minLength },
          { orgId: org.id, key: 'security.password.requireUppercase', value: PASSWORD_POLICY.requireUppercase },
          { orgId: org.id, key: 'security.password.requireLowercase', value: PASSWORD_POLICY.requireLowercase },
          { orgId: org.id, key: 'security.password.requireDigit', value: PASSWORD_POLICY.requireDigit },
          { orgId: org.id, key: 'security.password.requireSymbol', value: PASSWORD_POLICY.requireSymbol },
        ],
      });
      return { user, org, member };
    });

    const verificationToken = await this.tokens.issue(result.user.id, 'EMAIL_VERIFICATION');
    await this.mail.send({
      to: email,
      subject: 'Verify your NEXUS OS email',
      text: `Welcome to NEXUS OS. Verify your email: ${WEB_BASE}/verify-email?token=${verificationToken}`,
      meta: { type: 'EMAIL_VERIFICATION', token: verificationToken },
    });
    await this.events.record(result.org.id, 'SIGNUP', {
      userId: result.user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return this.buildSession(result.user.id, result.org.id, ['OWNER'], meta);
  }

  async signIn(input: { email: string; password: string }, meta: RequestMeta): Promise<SessionResult> {
    const email = input.email.toLowerCase().trim();
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new ApiException('AUTH_INVALID_CREDENTIALS');
    const ok = await compare(input.password, user.passwordHash);
    if (!ok) {
      // Record a failed attempt for the first org the user belongs to, if any.
      const anyMember = await this.prisma.client.organizationMember.findFirst({ where: { userId: user.id } });
      if (anyMember) await this.events.record(anyMember.orgId, 'LOGIN_FAILED', { userId: user.id, ip: meta.ip, userAgent: meta.userAgent });
      throw new ApiException('AUTH_INVALID_CREDENTIALS');
    }

    const membership = await withUserContext(user.id, async (tx) =>
      tx.organizationMember.findFirst({ where: { userId: user.id, status: 'ACTIVE' }, orderBy: { createdAt: 'asc' } }),
    );
    if (!membership) throw new ApiException('AUTH_NO_TENANT');

    const roles = await withTenant(membership.orgId, async (tx) => {
      const mrs = await tx.membershipRole.findMany({ where: { memberId: membership.id }, include: { role: { select: { code: true } } } });
      return mrs.map((mr) => mr.role.code);
    });

    await this.prisma.client.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.events.record(membership.orgId, 'LOGIN', { userId: user.id, ip: meta.ip, userAgent: meta.userAgent });

    return this.buildSession(user.id, membership.orgId, roles, meta);
  }

  async signOut(refreshToken: string | undefined, meta: RequestMeta, userId?: string): Promise<void> {
    if (refreshToken) {
      const session = await this.prisma.client.session.findUnique({ where: { id: refreshToken } });
      await this.sessionService.revoke(refreshToken);
      if (session?.orgId) {
        await this.events.record(session.orgId, 'LOGOUT', { userId, ip: meta.ip, userAgent: meta.userAgent });
      }
    }
  }

  async refresh(refreshToken: string | undefined, meta: RequestMeta): Promise<SessionResult | null> {
    if (!refreshToken) return null;
    const next = await this.sessionService.rotate(refreshToken, meta.ip, meta.userAgent);
    if (!next) return null;

    const session = await this.prisma.client.session.findUnique({ where: { id: next.token } });
    if (!session) return null;

    const roles = await withTenant(session.orgId, async (tx) => {
      const mrs = await tx.membershipRole.findMany({
        where: { member: { userId: session.userId } },
        include: { role: { select: { code: true } } },
      });
      return mrs.map((mr) => mr.role.code);
    });

    const claims: SessionClaim = { userId: session.userId, orgId: session.orgId, roles };
    const accessToken = await this.jwtService.signAsync(claims);
    return { user: claims, accessToken, refreshToken: next.token, csrf: this.csrf.mint(session.userId) };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Email verification / password reset / change password
  // ─────────────────────────────────────────────────────────────────────────────

  async verifyEmail(rawToken: string): Promise<void> {
    const token = await this.tokens.redeem(rawToken, 'EMAIL_VERIFICATION');
    if (!token) throw new ApiException('AUTH_TOKEN_INVALID');
    await withUserContext(token.userId, (tx) => tx.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } }));
    const member = await this.prisma.client.organizationMember.findFirst({ where: { userId: token.userId } });
    if (member) await this.events.record(member.orgId, 'EMAIL_VERIFIED', { userId: token.userId });
  }

  async forgotPassword(input: { email: string }, meta: RequestMeta): Promise<void> {
    const email = input.email.toLowerCase().trim();
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    // Never reveal whether the account exists.
    if (!user) return;
    const rawToken = await this.tokens.issue(user.id, 'PASSWORD_RESET');
    await this.mail.send({
      to: email,
      subject: 'Reset your NEXUS OS password',
      text: `Reset your password: ${WEB_BASE}/reset-password?token=${rawToken}`,
      meta: { type: 'PASSWORD_RESET', token: rawToken },
    });
  }

  async resetPassword(input: { token: string; password: string }, meta: RequestMeta): Promise<void> {
    const passwordErrors = validatePassword(input.password, PASSWORD_POLICY);
    if (passwordErrors.length) throw new ApiException('AUTH_PASSWORD_WEAK', { errors: passwordErrors });

    const token = await this.tokens.redeem(input.token, 'PASSWORD_RESET');
    if (!token) throw new ApiException('AUTH_TOKEN_INVALID');

    const passwordHash = await hash(input.password, 10);
    await withUserContext(token.userId, async (tx) => {
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
    });

    // Sessions are org-scoped (RLS), so revoke them per-org under the org context.
    const memberships = await withUserContext(token.userId, (tx) =>
      tx.organizationMember.findMany({ where: { userId: token.userId }, select: { orgId: true } }),
    );
    for (const m of memberships) {
      await withTenant(m.orgId, (tx) =>
        tx.session.updateMany({
          where: { userId: token.userId, status: 'ACTIVE' },
          data: { status: 'REVOKED', revokedAt: new Date() },
        }),
      );
    }

    const member = memberships[0];
    if (member) await this.events.record(member.orgId, 'PASSWORD_RESET', { userId: token.userId, ip: meta.ip, userAgent: meta.userAgent });
  }

  async changePassword(input: { currentPassword: string; newPassword: string }, userId: string, orgId: string, meta: RequestMeta): Promise<void> {
    const passwordErrors = validatePassword(input.newPassword, PASSWORD_POLICY);
    if (passwordErrors.length) throw new ApiException('AUTH_PASSWORD_WEAK', { errors: passwordErrors });

    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new ApiException('AUTH_UNAUTHENTICATED');
    const ok = await compare(input.currentPassword, user.passwordHash);
    if (!ok) throw new ApiException('AUTH_INVALID_CREDENTIALS');

    const passwordHash = await hash(input.newPassword, 10);
    await this.prisma.client.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.events.record(orgId, 'PASSWORD_CHANGED', { userId, ip: meta.ip, userAgent: meta.userAgent });
  }

  /** Switch the active tenant for a multi-org user (re-issue session). */
  async switchOrg(userId: string, orgId: string, meta: RequestMeta): Promise<SessionResult> {
    const membership = await withUserContext(userId, async (tx) =>
      tx.organizationMember.findFirst({ where: { userId, orgId, status: 'ACTIVE' } }),
    );
    if (!membership) throw new ApiException('ORG_NOT_FOUND');

    const roles = await withTenant(orgId, async (tx) => {
      const mrs = await tx.membershipRole.findMany({ where: { memberId: membership.id }, include: { role: { select: { code: true } } } });
      return mrs.map((mr) => mr.role.code);
    });

    await this.events.record(orgId, 'ORG_SWITCHED', { userId, ip: meta.ip, userAgent: meta.userAgent });
    return this.buildSession(userId, orgId, roles, meta);
  }
}

import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { RoleCode } from '@nexus/shared';
import { withTenant, withUserContext } from '@nexus/db';
import { ApiException } from '../common/exceptions';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityEventsService } from '../security/security-events.service';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const WEB_BASE = process.env.WEB_URL ?? 'http://localhost:3000';

@Injectable()
export class OrgsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: SecurityEventsService,
    private readonly mail: MailService,
  ) {}

  /** Current org profile (guard ensures user already has org access). */
  async current(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.organization.findUnique({ where: { id: orgId } }));
  }

  async update(orgId: string, input: { name?: string; plan?: string }) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.organization.update({ where: { id: orgId }, data: { ...(input.name ? { name: input.name } : {}) } }),
    );
  }

  /** Members of the current org. */
  async members(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.organizationMember.findMany({
        where: { orgId },
        include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } }, roles: { include: { role: { select: { code: true, name: true } } } } },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  /** Invite a member by email with a role. Returns the invite link. */
  async invite(orgId: string, invitedById: string, input: { email: string; roleCode: RoleCode }) {
    const email = input.email.toLowerCase().trim();
    const existing = await this.prisma.withTenant(orgId, (tx) =>
      tx.organizationMember.findFirst({ where: { orgId, user: { email } } }),
    );
    if (existing) throw new ApiException('CONFLICT');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = randomUUID();
    const tokenHash = hashToken(token);

    const invite = await this.prisma.withTenant(orgId, (tx) =>
      tx.invitation.create({
        data: { orgId, email, roleCode: input.roleCode, tokenHash, invitedById, expiresAt },
      }),
    );

    await this.mail.send({
      to: email,
      subject: `Join ${'your'} organization on NEXUS OS`,
      text: `Accept your invite: ${WEB_BASE}/accept-invite?token=${token}`,
      meta: { type: 'INVITE_ACCEPT', token },
    });
    await this.events.record(orgId, 'INVITE_SENT', { userId: invitedById, meta: { email } });

    return { id: invite.id, email, roleCode: input.roleCode, status: 'PENDING', expiresAt };
  }

  /**
   * Accept an invite by its unguessable token. Two-phase because of RLS:
   *   (a) look the invite up via `app.invite_token` (unguessable) to learn orgId,
   *   (b) join that org under a normal org-scoped transaction.
   */
  async acceptInvite(token: string, userId: string) {
    const tokenHash = hashToken(token);
    const invite = await this.prisma.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.invite_token', ${tokenHash}, true)`;
      return tx.invitation.findUnique({ where: { tokenHash } });
    });
    if (!invite) throw new ApiException('ORG_INVITE_INVALID');
    if (invite.status !== 'PENDING') throw new ApiException('ORG_INVITE_INVALID');
    if (invite.expiresAt.getTime() < Date.now()) throw new ApiException('ORG_INVITE_EXPIRED');

    const orgId = invite.orgId;
    const membership = await this.prisma.withTenant(orgId, (tx) =>
      tx.organizationMember.upsert({
        where: { orgId_userId: { orgId, userId } },
        update: { status: 'ACTIVE' },
        create: { orgId, userId, status: 'ACTIVE' },
      }),
    );
    const role = await this.prisma.withTenant(orgId, (tx) =>
      tx.role.findFirst({ where: { orgId, code: invite.roleCode } }),
    );
    if (role) {
      await this.prisma.withTenant(orgId, (tx) =>
        tx.membershipRole.upsert({
          where: { memberId_roleId: { memberId: membership.id, roleId: role.id } },
          update: {},
          create: { memberId: membership.id, roleId: role.id },
        }),
      );
    }
    await this.prisma.withTenant(orgId, (tx) =>
      tx.invitation.update({ where: { id: invite.id }, data: { status: 'ACCEPTED', acceptedById: userId, acceptedAt: new Date() } }),
    );
    await this.events.record(orgId, 'INVITE_ACCEPTED', { userId, meta: { email: invite.email } });
    return { ok: true, orgId };
  }

  /** Orgs the current user belongs to (for the switcher). */
  async myOrgs(userId: string) {
    return withUserContext(userId, (tx) =>
      tx.organizationMember.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { organization: { select: { id: true, name: true, slug: true } } },
      }),
    );
  }
}
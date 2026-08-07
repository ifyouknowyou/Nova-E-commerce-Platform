import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
loadEnv({ path: resolve(__dirname, '../../../.env') });

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { CSRF_COOKIE, CSRF_HEADER } from '@nexus/shared';
import { withTenant, prisma } from '@nexus/db';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';

/**
 * NEXUS OS — Phase 2 + Phase 3 e2e gates. Requires docker compose up +
 * migrate + seed. Cookie-session auth + CSRF, org isolation, RBAC, security
 * center, settings, and Phase-3 business modules against real data.
 */

type SuperAgent = ReturnType<typeof request.agent>;

let app: INestApplication;
let migrator: PrismaClient;

/** Sign in on a cookie jar agent and return {agent, csrf}. */
async function signIn(email: string, password: string): Promise<{ agent: SuperAgent; csrf: string }> {
  const agent = request.agent(app.getHttpServer());
  const res = await agent.post('/api/auth/sign-in').send({ email, password }).expect(201);
  const cookie = (res.headers['set-cookie'] as string[] | undefined)?.find((c) => c.startsWith(`${CSRF_COOKIE}=`));
  const csrf = cookie ? cookie.split(';')[0].split('=')[1] : '';
  return { agent, csrf };
}

/** Create a member in the acme org with the given role + a known password. */
async function makeMember(email: string, role: string, password = 'Member-Pass-123') {
  const passwordHash = await hash(password, 10);
  const user = await migrator.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: email },
  });
  const org = await migrator.organization.findFirstOrThrow({ where: { slug: 'acme' } });
  const member = await migrator.organizationMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
    update: { status: 'ACTIVE' },
    create: { orgId: org.id, userId: user.id, status: 'ACTIVE' },
  });
  const roleRow = await migrator.role.findFirstOrThrow({ where: { orgId: org.id, code: role } });
  await migrator.membershipRole.upsert({
    where: { memberId_roleId: { memberId: member.id, roleId: roleRow.id } },
    update: {},
    create: { memberId: member.id, roleId: roleRow.id },
  });
  return { email, password };
}

describe('NEXUS OS e2e', () => {
  const ownerEmail = 'admin@nexus.local';
  const ownerPassword = 'nexus-demo-password';

  beforeAll(async () => {
    migrator = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_MIGRATE_URL } } });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    await migrator?.$disconnect();
  });

  describe('auth lifecycle + CSRF', () => {
    it('sign-in sets cookies and /auth/me works via the cookie session', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.get('/api/auth/me').expect(200);
      expect(res.body.roles).toContain('OWNER');
    });

    it('state-changing request WITHOUT CSRF token is rejected', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.patch('/api/settings').send({ theme: 'dark' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_INVALID');
    });

    it('sign-up with policy-weak password returns AUTH_PASSWORD_WEAK', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send({ name: 'Weak', email: 'weak@nexus.local', password: 'alllowercasepass' });
      expect(res.status).toBe(422);
      expect(res.body.code).toBe('AUTH_PASSWORD_WEAK');
    });
  });

  describe('org isolation', () => {
    it('cross-tenant denial holds (org-A claim sees 0 org-B roles)', async () => {
      const orgA = await prisma.organization.findFirstOrThrow({ where: { slug: 'acme' } });
      const orgB = await prisma.organization.findFirstOrThrow({ where: { slug: 'beta' } });
      const res = await withTenant(orgA.id, async (tx) => {
        const a = await tx.role.count({ where: { orgId: orgA.id } });
        const b = await tx.role.count({ where: { orgId: orgB.id } });
        return { a, b };
      });
      expect(res.a).toBeGreaterThan(0);
      expect(res.b).toBe(0);
    });
  });

  describe('Phase 3 — business modules (real data, RBAC, tenant isolation)', () => {
    it('OWNER can create + list CRM deals', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const created = await agent
        .post('/api/crm/deals').set(CSRF_HEADER, csrf).send({ name: 'e2e Deal', value: 25000, stage: 'NEW' }).expect(201);
      expect(created.body.id).toBeTruthy();
      const list = await agent.get('/api/crm/deals').expect(200);
      expect(list.body.items.some((d: { name: string }) => d.name === 'e2e Deal')).toBe(true);
    });

    it('SUPPORT (lacks crm.deal.create) is denied 403 by the RBAC guard', async () => {
      const member = await makeMember('support@phase3.local', 'SUPPORT');
      const { agent, csrf } = await signIn(member.email, member.password);
      const res = await agent.post('/api/crm/deals').set(CSRF_HEADER, csrf).send({ name: 'nope', value: 1 }).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('quote totals are server-computed', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.post('/api/sales/quotes').set(CSRF_HEADER, csrf).send({
        number: `Q-${Date.now()}`, taxRate: 0.1,
        items: [{ description: 'A', qty: 10, unitPrice: 100 }, { description: 'B', qty: 2, unitPrice: 250 }],
      }).expect(201);
      expect(Number(res.body.total)).toBe(1650);
    });

    it('cross-tenant denial holds for deals', async () => {
      const orgA = await prisma.organization.findFirstOrThrow({ where: { slug: 'acme' } });
      const orgB = await prisma.organization.findFirstOrThrow({ where: { slug: 'beta' } });
      const bCount = await withTenant(orgA.id, (tx) => tx.deal.count({ where: { orgId: orgB.id } }));
      expect(bCount).toBe(0);
    });

    it('record-payment updates invoice status to PAID', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const inv = await agent.post('/api/finance/invoices').set(CSRF_HEADER, csrf).send({
        number: `INV-${Date.now()}`, taxRate: 0, items: [{ description: 'Service', qty: 1, unitPrice: 1000 }],
      }).expect(201);
      const paid = await agent.post(`/api/finance/invoices/${inv.body.id}/payments`).set(CSRF_HEADER, csrf).send({ amount: 1000 }).expect(201);
      expect(paid.body.paidAmount).toBe(1000);
      expect(paid.body.status).toBe('PAID');
    });

    it('dashboard/kpis returns the documented live-data shape', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.get('/api/dashboard/kpis').expect(200);
      expect(res.body).toMatchObject({
        revenue: expect.any(Number),
        expenses: expect.any(Number),
        profit: expect.any(Number),
        pipelineValue: expect.any(Number),
        forecast: { actual: expect.any(Number), projected: expect.any(Number), estimated: expect.any(Number) },
      });
    });
  });
});
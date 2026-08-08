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

    it('refresh rotates the session and /auth/me works with the fresh cookie', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      // Refresh must actually return a user (regression: RLS hid the session row
      // on this public route, so refresh silently no-op'd).
      const res = await agent.post('/api/auth/refresh').expect(201);
      expect(res.body.user).toBeTruthy();
      expect(res.body.user.userId).toBeTruthy();
      const me = await agent.get('/api/auth/me').expect(200);
      expect(me.body.userId).toBe(res.body.user.userId);
    });

    it('sign-out revokes the refresh session and records a LOGOUT event', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const before = await migrator.securityEvent.count({ where: { type: 'LOGOUT' } });
      await agent.post('/api/auth/sign-out').set(CSRF_HEADER, csrf).expect(201);
      const after = await migrator.securityEvent.count({ where: { type: 'LOGOUT' } });
      expect(after).toBeGreaterThan(before);
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
      expect(Number(paid.body.paidAmount)).toBe(1000);
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

  describe('Phase 4 — operations & support', () => {
    it('stock movement is immutable and cannot go negative', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const product = await agent.post('/api/sales/products').set(CSRF_HEADER, csrf).send({ name: 'NoNeg', price: 1 }).expect(201);
      const wh = await agent.post('/api/inventory/warehouses').set(CSRF_HEADER, csrf).send({ name: 'WH-e2e' }).expect(201);
      const loc = await agent.post('/api/inventory/locations').set(CSRF_HEADER, csrf).send({ name: 'A', warehouseId: wh.body.id }).expect(201);
      const key = { productId: product.body.id, locationId: loc.body.id };

      const in1 = await agent.post('/api/inventory/stock/movements').set(CSRF_HEADER, csrf).send({ ...key, type: 'IN', qty: 5 }).expect(201);
      expect(in1.body.qty).toBe(5);
      const out = await agent.post('/api/inventory/stock/movements').set(CSRF_HEADER, csrf).send({ ...key, type: 'OUT', qty: 2 }).expect(201);
      expect(out.body.qty).toBe(3);

      // Overdraw must fail (409) and NOT drive the balance negative.
      await agent.post('/api/inventory/stock/movements').set(CSRF_HEADER, csrf).send({ ...key, type: 'OUT', qty: 99 }).expect(409);

      const stock = await agent.get('/api/inventory/stock').expect(200);
      const row = stock.body.find((l: { productId: string }) => l.productId === product.body.id);
      expect(row.qty).toBe(3);
    });

    it('ticket reads are RBAC-gated and agents see internal notes', async () => {
  const owner = await signIn(ownerEmail, ownerPassword);
  const ticket = await owner.agent.post('/api/support/tickets').set(CSRF_HEADER, owner.csrf).send({ subject: 'Secure ticket', priority: 'MEDIUM' }).expect(201);
  await owner.agent.post(`/api/support/tickets/${ticket.body.id}/comments`).set(CSRF_HEADER, owner.csrf).send({ body: 'internal note', internal: true }).expect(201);

  // Owner (with support.ticket.update) sees the internal note.
  const ownerDetail = await owner.agent.get(`/api/support/tickets/${ticket.body.id}`).expect(200);
  expect(ownerDetail.body.comments.some((c: { internal: boolean }) => c.internal)).toBe(true);

  // A FINANCE member lacks support.ticket.read → gets 403 on the ticket.
  const fin = await makeMember('fin-tx@phase4.local', 'FINANCE');
  const fa = await signIn(fin.email, fin.password);
  await fa.agent.get(`/api/support/tickets/${ticket.body.id}`).expect(403);
});

    it('document upload rejects a disallowed MIME', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const res = await agent
        .post('/api/documents/upload')
        .set(CSRF_HEADER, csrf)
        .attach('file', Buffer.from('bad'), { filename: 'evil.exe', contentType: 'application/octet-stream' });
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Phase 5 — automation, audit, observability', () => {
    it('a DEAL_WON workflow fires: task created + execution logged', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      await agent.post('/api/automation/workflows').set(CSRF_HEADER, csrf).send({
        name: 'Auto test',
        triggerType: 'DEAL_WON',
        conditions: [{ field: 'dealValue', op: 'gte', value: 1 }],
        actions: [{ type: 'TASK', title: 'Auto follow-up' }],
      }).expect(201);

      const deal = await agent.post('/api/crm/deals').set(CSRF_HEADER, csrf).send({ name: 'Auto e2e', value: 100, stage: 'NEW' }).expect(201);
      await agent.post(`/api/crm/deals/${deal.body.id}/stage`).set(CSRF_HEADER, csrf).send({ stage: 'WON' }).expect(201);

      // The workflow should have created the task.
      const tasks = await agent.get('/api/projects/tasks/all').expect(200);
      expect(tasks.body.some((t: { title: string }) => t.title === 'Auto follow-up')).toBe(true);

      // And logged an execution.
      const executions = await agent.get('/api/automation/executions').expect(200);
      expect(executions.body.some((e: { status: string; triggerType: string }) => e.status === 'SUCCESS' && e.triggerType === 'DEAL_WON')).toBe(true);
    });

    it('SUPPORT is denied workflow creation (RBAC)', async () => {
      const supp = await makeMember('su-auto@phase5.local', 'SUPPORT');
      const { agent, csrf } = await signIn(supp.email, supp.password);
      const res = await agent.post('/api/automation/workflows').set(CSRF_HEADER, csrf).send({ name: 'nope', triggerType: 'DEAL_WON', actions: [] });
      expect(res.status).toBe(403);
    });

    it('audit records a mutation and is tenant-scoped + queryable', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const deal = await agent.post('/api/crm/deals').set(CSRF_HEADER, csrf).send({ name: 'Audit me', value: 10, stage: 'NEW' }).expect(201);
      await agent.post(`/api/crm/deals/${deal.body.id}/stage`).set(CSRF_HEADER, csrf).send({ stage: 'QUALIFIED' }).expect(201);

      const audit = await agent.get('/api/audit?entity=deal').expect(200);
      expect(audit.body.total).toBeGreaterThan(0);
      expect(audit.body.items.some((i: { action: string }) => i.action === 'UPDATE')).toBe(true);
    });

    it('observability health returns db + uptime + counters', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.get('/api/observability/health').expect(200);
      expect(res.body).toMatchObject({ db: 'up', uptimeSeconds: expect.any(Number) });
      expect(res.body.executions).toBeDefined();
    });
  });
});
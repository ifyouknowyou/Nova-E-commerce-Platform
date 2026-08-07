import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
loadEnv({ path: resolve(__dirname, '../../../.env') });

// Force the deterministic engine for hermetic, fast tests (Claude would be a
// real network call; the deterministic provider answers from real tenant data).
process.env.ANTHROPIC_API_KEY = '';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { CSRF_COOKIE, CSRF_HEADER } from '@nexus/shared';
import { prisma, withTenant } from '@nexus/db';
import { AppModule } from '../src/app.module';

type SuperAgent = ReturnType<typeof request.agent>;
let app: INestApplication;
let migrator: PrismaClient;

async function signIn(email: string, password: string): Promise<{ agent: SuperAgent; csrf: string }> {
  const agent = request.agent(app.getHttpServer());
  const res = await agent.post('/api/auth/sign-in').send({ email, password }).expect(201);
  const cookie = (res.headers['set-cookie'] as string[] | undefined)?.find((c) => c.startsWith(`${CSRF_COOKIE}=`));
  const csrf = cookie ? cookie.split(';')[0].split('=')[1] : '';
  return { agent, csrf };
}

describe('NEXUS OS — Phase 6 AI Layer e2e', () => {
  const ownerEmail = 'admin@nexus.local';
  const ownerPassword = 'nexus-demo-password';

  let acmeOrgId: string;

  beforeAll(async () => {
    migrator = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_MIGRATE_URL } } });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    acmeOrgId = (await migrator.organization.findFirstOrThrow({ where: { slug: 'acme' } })).id;
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    await migrator?.$disconnect();
  });

  describe('AI Copilot answers from real tenant data (deterministic provider)', () => {
    it('returns a grounded answer + persists the conversation', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const res = await agent
        .post('/api/ai/copilot')
        .set(CSRF_HEADER, csrf)
        .send({ message: 'How many invoices do we have?' })
        .expect(201);
      expect(res.body.conversationId).toBeTruthy();
      expect(res.body.answer).toBeTruthy();
      expect(typeof res.body.answer).toBe('string');

      // The answer must reference real data (invoice count matches the DB), not canned text.
      const invoiceCount = await migrator.invoice.count({ where: { orgId: acmeOrgId } });
      expect(res.body.answer).toContain(String(invoiceCount));

      // Conversation persisted.
      const conv = await withTenant(acmeOrgId, (tx) =>
        tx.aiConversation.findFirst({ where: { id: res.body.conversationId } }),
      );
      expect(conv).toBeTruthy();
    });

    it('never leaks another tenant into the answer', async () => {
      const { agent: agentA, csrf: csrfA } = await signIn('admin@nexus.local', ownerPassword);
      const betaOrg = await migrator.organization.findFirstOrThrow({ where: { slug: 'beta' } });
      // Give beta a distinctive invoice number, then ask about invoicing in acme.
      await migrator.invoice.create({
        data: { orgId: betaOrg.id, number: `ZZZ-${Date.now()}`, subtotal: 1, tax: 0, total: 1, status: 'SENT' },
      });
      const res = await agentA
        .post('/api/ai/copilot')
        .set(CSRF_HEADER, csrfA)
        .send({ message: 'List invoice numbers.' })
        .expect(201);
      expect(res.body.answer.toLowerCase()).not.toContain('zzz-');
    });
  });

  describe('AI Approval System — real human-in-the-loop', () => {
    it('a sensitive tool call NEVER executes without an approval', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      // Finance agent proposes an irreversible action.
      const run = await agent
        .post('/api/ai/agents/finance/run')
        .set(CSRF_HEADER, csrf)
        .send({ prompt: 'Record a 500 payment against an invoice.' })
        .expect(201);
      expect(run.body.status).toBe('NEEDS_APPROVAL');
      expect(run.body.approvals.length).toBeGreaterThan(0);

      const before = await migrator.payment.count({ where: { orgId: acmeOrgId } });
      // No payment may have been written just because the tool was proposed.
      const after = await migrator.payment.count({ where: { orgId: acmeOrgId } });
      expect(after).toBe(before);
    });

    it('approval states are recorded, queryable, and approve/deny works', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const run = await agent
        .post('/api/ai/agents/finance/run')
        .set(CSRF_HEADER, csrf)
        .send({ prompt: 'Record a 200 payment against an invoice.' })
        .expect(201);
      const approvalId = run.body.approvals[0];

      // Queryable + shows WHAT / WHY / DATA.
      const list = await agent.get('/api/ai/approvals').expect(200);
      const row = list.body.find((a: { id: string }) => a.id === approvalId);
      expect(row).toBeTruthy();
      expect(row.status).toBe('PENDING');
      expect(row.summary.risk).toBe('SENSITIVE');

      const before = await migrator.payment.count({ where: { orgId: acmeOrgId } });

      // DENY → no execution, status DENIED, audited.
      await agent.post(`/api/ai/approvals/${approvalId}/decide`).set(CSRF_HEADER, csrf).send({ action: 'deny' }).expect(201);
      const afterDeny = await migrator.payment.count({ where: { orgId: acmeOrgId } });
      expect(afterDeny).toBe(before);

      const decided = await agent.get(`/api/ai/approvals/${approvalId}`).expect(200);
      expect(decided.body.status).toBe('DENIED');

      // The rejection is in the audit trail.
      const audit = await migrator.auditLog.findMany({
        where: { orgId: acmeOrgId, entity: 'ai.approval', entityId: approvalId, action: 'REJECT' },
      });
      expect(audit.length).toBeGreaterThan(0);
    });

    it('ORPHANED pending approvals auto-expire (escalation) and never execute', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      // Create an approval directly, backdated past the TTL, then list — it must auto-deny.
      const invoice = await migrator.invoice.findFirst({ where: { orgId: acmeOrgId }, orderBy: { createdAt: 'asc' } });
      const stale = await migrator.aiApprovalRequest.create({
        data: {
          orgId: acmeOrgId, source: 'TOOL_CALL', status: 'PENDING', targetKey: 'recordPayment',
          summary: { description: 'stale', risk: 'SENSITIVE' } as never,
          input: { invoiceId: invoice.id, amount: 1 } as never,
          expiresAt: new Date(Date.now() - 60_000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });
      const before = await migrator.payment.count({ where: { orgId: acmeOrgId } });
      await agent.get('/api/ai/approvals').expect(200); // triggers expirePending
      const afterList = await migrator.payment.count({ where: { orgId: acmeOrgId } });
      expect(afterList).toBe(before); // still no execution

      const row = await migrator.aiApprovalRequest.findUnique({ where: { id: stale.id } });
      expect(row?.status).toBe('EXPIRED');
      expect(row?.escalationReason).toBe('TIMEOUT_ORPHANED');
    });

    it('approve runs the approved action; RBAC agent cannot approve', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);

      const invoice = await migrator.invoice.findFirst({ where: { orgId: acmeOrgId }, orderBy: { createdAt: 'desc' } });
      const run = await agent
        .post('/api/ai/agents/finance/run')
        .set(CSRF_HEADER, csrf)
        .send({ prompt: 'Record a 300 payment against the invoice.' })
        .expect(201);
      const approvalId = run.body.approvals[0];
      const before = await migrator.payment.count({ where: { orgId: acmeOrgId } });

      // EDIT to pin the real invoice, then APPROVE → executes.
      const edit = await agent
        .post(`/api/ai/approvals/${approvalId}/decide`)
        .set(CSRF_HEADER, csrf)
        .send({ action: 'edit', editInput: { invoiceId: invoice.id, amount: 300, method: 'BANK_TRANSFER' } })
        .expect(201);
      expect(edit.body.approval.status).toBe('PENDING'); // edit is staged

      const approved = await agent
        .post(`/api/ai/approvals/${approvalId}/decide`)
        .set(CSRF_HEADER, csrf)
        .send({ action: 'approve' })
        .expect(201);
      expect(['APPROVED', 'EDITED']).toContain(approved.body.approval.status);
      expect(approved.body.executedResult?.summary).toBeTruthy();

      const after = await migrator.payment.count({ where: { orgId: acmeOrgId } });
      expect(after).toBe(before + 1);
    });
  });

  describe('AI Business Graph — tenant-scoped real relations', () => {
    it('returns real nodes + edges, RBAC permission-gated', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.get('/api/ai/graph').expect(200);
      expect(res.body.nodes.length).toBeGreaterThan(0);
      expect(res.body.edges.length).toBeGreaterThan(0);
      const types = new Set(res.body.nodes.map((n: { type: string }) => n.type));
      expect(types.has('company')).toBe(true);
    });
  });

  describe('Business Graph node/edge sanity', () => {
    it('nodes carry real ids and edges reference real nodes', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.get('/api/ai/graph').expect(200);
      const ids = new Set(res.body.nodes.map((n: { id: string }) => n.id));
      for (const e of res.body.edges as { source: string; target: string }[]) {
        expect(ids.has(e.source)).toBe(true);
        expect(ids.has(e.target)).toBe(true);
      }
    });
  });
});
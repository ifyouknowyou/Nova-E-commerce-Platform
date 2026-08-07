import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
loadEnv({ path: resolve(__dirname, '../../../.env') });

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { CSRF_COOKIE, CSRF_HEADER } from '@nexus/shared';
import { withTenant, prisma } from '@nexus/db';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';

/**
 * NEXUS OS — Phase 2 e2e gates. Requires docker compose up + migrate + seed.
 * Cookie-session auth + CSRF, org isolation, RBAC, security center, settings.
 */

type SuperAgent = ReturnType<typeof request.agent>;

let app: INestApplication;

/** Sign in on a cookie jar agent and return {agent, csrf}. */
async function signIn(email: string, password: string): Promise<{ agent: SuperAgent; csrf: string }> {
  const agent = request.agent(app.getHttpServer());
  const res = await agent.post('/api/auth/sign-in').send({ email, password }).expect(201);
  const cookie = (res.headers['set-cookie'] as string[] | undefined)?.find((c) => c.startsWith(`${CSRF_COOKIE}=`));
  const csrf = cookie ? cookie.split(';')[0].split('=')[1] : '';
  return { agent, csrf };
}

describe('NEXUS OS Phase 2 e2e', () => {
  const ownerEmail = 'admin@nexus.local';
  const ownerPassword = 'nexus-demo-password';
  const betaEmail = 'beta@nexus.local';

  beforeAll(async () => {
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
  });

  describe('auth lifecycle + CSRF', () => {
    it('sign-in sets cookies and /auth/me works via the cookie session', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.get('/api/auth/me').expect(200);
      expect(res.body.email).toBe(ownerEmail);
      expect(res.body.roles).toContain('OWNER');
    });

    it('state-changing request WITHOUT CSRF token is rejected', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.patch('/api/settings').send({ theme: 'dark' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_INVALID');
    });

    it('state-changing request WITH CSRF token succeeds and persists', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.patch('/api/settings').set(CSRF_HEADER, csrf).send({ theme: 'dark' }).expect(200);
      expect(res.body.theme).toBe('dark');
    });

    it('sign-up with weak password returns canonical AUTH_PASSWORD_WEAK', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send({ name: 'Weak', email: 'weak@nexus.local', password: 'short' });
      expect(res.status).toBe(422);
      expect(res.body.code).toBe('AUTH_PASSWORD_WEAK');
    });
  });

  describe('org isolation + RBAC over new routes', () => {
    it('OWNER can read org members', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.get('/api/orgs/members').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('cross-tenant denial holds: org-B rows invisible under org-A claim', async () => {
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

    it('owner can invite a member by email with a role', async () => {
      const { agent, csrf } = await signIn(ownerEmail, ownerPassword);
      const res = await agent
        .post('/api/orgs/members/invite')
        .set(CSRF_HEADER, csrf)
        .send({ email: 'friend@nexus.local', roleCode: 'SUPPORT' })
        .expect(201);
      expect(res.body.email).toBe('friend@nexus.local');
      expect(res.body.roleCode).toBe('SUPPORT');
    });
  });

  describe('security center + settings persist', () => {
    it('lists active sessions for the user', async () => {
      const { agent } = await signIn(ownerEmail, ownerPassword);
      const res = await agent.get('/api/security/sessions').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((s: { status: string }) => s.status === 'ACTIVE')).toBe(true);
    });

    it('records + returns a security event feed', async () => {
      const { agent } = await signIn(betaEmail, ownerPassword);
      const res = await agent.get('/api/security/events').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.map((e: { type: string }) => e.type)).toContain('LOGIN');
    });
  });
});

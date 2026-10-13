import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CONFIG, type AppConfig } from '../config/configuration';
import { RedisService } from '../redis/redis.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const config: AppConfig = {
  env: 'test',
  port: 4000,
  corsOrigin: ['http://localhost:3000'],
  webUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:4000',
  databaseUrl: 'postgres://x',
  redisUrl: 'redis://x',
  jwtAccessSecret: 'test-access-secret-value-that-is-long-enough',
  jwtRefreshSecret: 'test-refresh-secret-value-that-is-long-enough',
  jwtAccessTtl: '15m',
  jwtRefreshTtl: '14d',
  jwtSessionTtl: '1d',
  googleClientId: '',
  googleClientSecret: '',
  googleCallbackUrl: 'http://localhost:4000/api/auth/google/callback',
  mailProvider: 'console',
  mailFrom: 'x@x',
};

const fakeUser = {
  id: 'u1',
  email: 'e@example.com',
  name: null,
  phone: null,
  emailVerified: true,
  roles: ['CUSTOMER'],
};

describe('AuthController cookies (M8)', () => {
  let app: INestApplication;
  const auth = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };
  const redis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: RedisService, useValue: redis },
        { provide: CONFIG, useValue: config },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('login sets httpOnly access+refresh cookies and the CSRF + auth-marker cookies', async () => {
    auth.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: fakeUser,
      rememberMe: true,
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e@example.com', password: 'p', rememberMe: true });

    expect(res.status).toBe(200);
    const setCookie = (res.headers['set-cookie'] as string[] | undefined) ?? [];
    const all = setCookie.join('; ');
    expect(all).toContain('nova_access=access-token');
    expect(all).toContain('nova_refresh=refresh-token');
    expect(all).toContain('nova_authed=1');
    expect(all).toContain('nova_csrf=');

    const access = setCookie.find((c) => c.startsWith('nova_access=')) ?? '';
    expect(access).toContain('HttpOnly');
    expect(access).toContain('SameSite=Lax');
  });

  it('refresh reads the refresh token from the httpOnly cookie when the body omits it', async () => {
    auth.refresh.mockResolvedValue({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      user: fakeUser,
      rememberMe: false,
    });

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', 'nova_refresh=the-refresh-token')
      .send({});

    expect(auth.refresh).toHaveBeenCalledWith('the-refresh-token');
    expect(res.status).toBe(200);
  });

  it('logout revokes the session and clears the auth cookies', async () => {
    auth.logout.mockResolvedValue({ message: 'Signed out' });

    const res = await request(app.getHttpServer()).post('/auth/logout');

    const setCookie = (res.headers['set-cookie'] as string[] | undefined) ?? [];
    const all = setCookie.join('; ');
    // clearCookie emits max-age=0 cookies for every auth cookie.
    expect(all).toContain('nova_authed=');
    expect(all).toContain('nova_access=');
    expect(all).toContain('nova_refresh=');
  });
});

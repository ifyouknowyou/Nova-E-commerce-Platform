import { JwtService } from '@nestjs/jwt';
import type { AppConfig } from '../config/configuration';
import { TokensService } from './tokens.service';

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

describe('TokensService', () => {
  let service: TokensService;
  const redis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), scanKeys: jest.fn() };
  const prisma = { db: { user: { update: jest.fn().mockResolvedValue(null) } } };

  beforeEach(() => {
    const jwt = new JwtService({ secret: config.jwtAccessSecret });
    service = new TokensService(config, jwt, redis as any, prisma as any);
  });

  it('issues an access token that EXPIRES (enforces JWT_ACCESS_TTL)', async () => {
    const token = await service.issueAccessToken('u1', 'a@b.com', ['CUSTOMER'], 0);
    const decoded: any = new JwtService({ secret: config.jwtAccessSecret }).decode(token);

    expect(decoded).not.toBeNull();
    expect(decoded.sub).toBe('u1');
    expect(decoded.tokenVersion).toBe(0);
    expect(decoded.jti).toBeDefined();

    // The fix: a token must carry an exp — ~15m after issuance, NOT live forever.
    expect(decoded.exp).toBeDefined();
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  it('bumpTokenVersion increments the stored token version', async () => {
    await service.bumpTokenVersion('u1');
    expect(prisma.db.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { tokenVersion: { increment: 1 } },
    });
  });
});
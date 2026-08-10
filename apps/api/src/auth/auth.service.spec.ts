import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { CONFIG, type AppConfig } from '../config/configuration';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { RedisService } from '../redis/redis.service';
import { StoreService } from '../store/store.service';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';

const config: AppConfig = {
  env: 'test',
  port: 4000,
  corsOrigin: ['http://localhost:3000'],
  webUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:4000',
  databaseUrl: 'postgres://x',
  redisUrl: 'redis://x',
  jwtAccessSecret: 'test-access-secret',
  jwtRefreshSecret: 'test-refresh-secret',
  jwtAccessTtl: '15m',
  jwtRefreshTtl: '14d',
  jwtSessionTtl: '1d',
  googleClientId: '',
  googleClientSecret: '',
  googleCallbackUrl: 'http://localhost:4000/api/auth/google/callback',
  mailProvider: 'console',
  mailFrom: 'x@x',
  s3Endpoint: '',
  s3Region: '',
  s3Bucket: '',
  s3AccessKey: '',
  s3SecretKey: '',
  s3ForcePathStyle: true,
};

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    db: {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      auditLog: { create: jest.fn() },
    },
  };
  const redis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), scanKeys: jest.fn() };
  const tokens = {
    issueAccessToken: jest.fn().mockResolvedValue('access-token'),
    createRefreshSession: jest.fn().mockResolvedValue('refresh-token'),
    verify: jest.fn(),
    revoke: jest.fn().mockResolvedValue(undefined),
    revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    bumpTokenVersion: jest.fn().mockResolvedValue(undefined),
  };
  const rbac = { assignRole: jest.fn().mockResolvedValue(undefined), getRolesForUser: jest.fn().mockResolvedValue(['CUSTOMER']) };
  const mail = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordChangedEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: TokensService, useValue: tokens },
        { provide: RbacService, useValue: rbac },
        { provide: MailService, useValue: mail },
        { provide: StoreService, useValue: { createStore: jest.fn().mockResolvedValue({ id: 's1', status: 'ACTIVE' }) } },
        { provide: CONFIG, useValue: config },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  const baseUser = {
    id: 'u1',
    email: 'test@example.com',
    name: 'Tester',
    phone: null,
    passwordHash: '',
    emailVerifiedAt: new Date(),
    rememberMe: false,
    lastLoginAt: null,
    status: 'ACTIVE',
    avatarKey: null,
    googleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  describe('register', () => {
    it('creates a user, assigns CUSTOMER, and sends a verification email', async () => {
      prisma.db.user.findUnique.mockResolvedValue(null);
      prisma.db.user.create.mockResolvedValue({ ...baseUser, id: 'u-new' });
      redis.set.mockResolvedValue(undefined);

      const result = await service.register({
        email: 'test@example.com',
        password: 'Passw0rd!',
        name: 'Tester',
      });

      expect(prisma.db.user.create).toHaveBeenCalledTimes(1);
      expect(rbac.assignRole).toHaveBeenCalledWith('u-new', 'CUSTOMER');
      expect(prisma.db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-new' },
          data: expect.objectContaining({ emailVerificationCode: expect.any(String) }),
        }),
      );
      expect(mail.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        'Tester',
      );
      expect(result.email).toBe('test@example.com');
    });

    it('rejects a duplicate email', async () => {
      prisma.db.user.findUnique.mockResolvedValue(baseUser);
      await expect(
        service.register({ email: 'test@example.com', password: 'Passw0rd!', name: 'X' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const hash = await argon2.hash('Passw0rd!', { type: argon2.argon2id });
      const user = { ...baseUser, passwordHash: hash, emailVerifiedAt: new Date() };
      prisma.db.user.findUnique.mockResolvedValue(user);
      prisma.db.user.update.mockResolvedValue(user);

      const result = await service.login('test@example.com', 'Passw0rd!', false);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.roles).toContain('CUSTOMER');
      expect(prisma.db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lastLoginAt: expect.any(Date) }) }),
      );
    });

    it('rejects unverified accounts', async () => {
      const hash = await argon2.hash('Passw0rd!', { type: argon2.argon2id });
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash, emailVerifiedAt: null });

      await expect(service.login('test@example.com', 'Passw0rd!', false)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rejects a wrong password', async () => {
      const hash = await argon2.hash('Passw0rd!', { type: argon2.argon2id });
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash });

      await expect(service.login('test@example.com', 'WrongPass1', false)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an unknown email (no enumeration)', async () => {
      prisma.db.user.findUnique.mockResolvedValue(null);
      await expect(service.login('ghost@example.com', 'Passw0rd!', false)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a banned account even with valid credentials', async () => {
      const hash = await argon2.hash('Passw0rd!', { type: argon2.argon2id });
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash, status: 'BANNED' });

      await expect(service.login('test@example.com', 'Passw0rd!', false)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a soft-deleted account', async () => {
      const hash = await argon2.hash('Passw0rd!', { type: argon2.argon2id });
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash, deletedAt: new Date() });

      await expect(service.login('test@example.com', 'Passw0rd!', false)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('issues tokens with the user tokenVersion', async () => {
      const hash = await argon2.hash('Passw0rd!', { type: argon2.argon2id });
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash, tokenVersion: 3 });

      await service.login('test@example.com', 'Passw0rd!', false);

      expect(tokens.issueAccessToken).toHaveBeenCalledWith('u1', 'test@example.com', ['CUSTOMER'], 3);
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and issues a new pair', async () => {
      tokens.verify.mockResolvedValue({ userId: 'u1', createdAt: new Date().toISOString() });
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser });

      const result = await service.refresh('old-refresh-token');

      expect(tokens.revoke).toHaveBeenCalledWith('old-refresh-token');
      expect(tokens.createRefreshSession).toHaveBeenCalledWith('u1', false);
      expect(result.accessToken).toBe('access-token');
    });

    it('throws when the refresh token is unknown/revoked', async () => {
      tokens.verify.mockRejectedValue(new UnauthorizedException('Invalid or expired refresh token'));

      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a suspended user on refresh (cannot keep minting tokens)', async () => {
      tokens.verify.mockResolvedValue({ userId: 'u1', createdAt: new Date().toISOString() });
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, status: 'SUSPENDED' });

      await expect(service.refresh('valid-refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('googleLogin', () => {
    it('links Google only to an already email-verified account', async () => {
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, googleId: null, emailVerifiedAt: new Date() });

      await service.googleLogin({ id: 'google-1', email: 'test@example.com', name: 'Tester' });

      expect(prisma.db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ googleId: 'google-1' }) }),
      );
    });

    it('refuses to link Google to an unverified account (takeover protection)', async () => {
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, googleId: null, emailVerifiedAt: null });

      await expect(
        service.googleLogin({ id: 'google-1', email: 'test@example.com', name: 'Tester' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('invalidates access tokens by bumping tokenVersion', async () => {
      const hash = await argon2.hash('OldPassw0rd!', { type: argon2.argon2id });
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash });

      await service.changePassword('u1', 'OldPassw0rd!', 'NewPassw0rd!');

      expect(tokens.revokeAllForUser).toHaveBeenCalledWith('u1');
      expect(tokens.bumpTokenVersion).toHaveBeenCalledWith('u1');
    });
  });

  describe('resetPassword', () => {
    it('updates the hash and revokes all sessions', async () => {
      redis.get.mockResolvedValue('u1');
      prisma.db.user.findUnique.mockResolvedValue({ ...baseUser });

      await service.resetPassword('reset-token', 'NewPassw0rd!');

      expect(prisma.db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ passwordHash: expect.any(String) }) }),
      );
      expect(tokens.revokeAllForUser).toHaveBeenCalledWith('u1');
      expect(mail.sendPasswordChangedEmail).toHaveBeenCalled();
    });
  });
});

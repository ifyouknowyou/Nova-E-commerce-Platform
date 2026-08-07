import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';
import { RbacService } from '../rbac.service';

describe('RbacGuard — single reusable guard (Decision 3)', () => {
  const reflector = new Reflector();
  const jwt = new JwtService({ secret: 'test-secret' });
  const rbac = {
    getEffectivePermissions: jest.fn(),
  } as unknown as RbacService;

  const sign = (payload: Record<string, unknown>) => jwt.signAsync(payload);

  // Minimal ExecutionContext for the mocked guard calls.
  const ctxFor = (headers: Record<string, string>) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ headers }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as never;

  it('passes @Public routes without a token', async () => {
    const guard = new RbacGuard(reflector, jwt, rbac);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true); // isPublic
    await expect(guard.canActivate(ctxFor({}))).resolves.toBe(true);
  });

  it('rejects a missing token with AUTH_UNAUTHENTICATED', async () => {
    const guard = new RbacGuard(reflector, jwt, rbac);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(ctxFor({}))).rejects.toMatchObject({
      code: 'AUTH_UNAUTHENTICATED',
    });
  });

  it('rejects a token without a tenant claim (fail closed)', async () => {
    const guard = new RbacGuard(reflector, jwt, rbac);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const tok = await sign({ sub: 'u1', email: 'u@x.co' }); // no orgId
    await expect(guard.canActivate(ctxFor({ authorization: `Bearer ${tok}` }))).rejects.toMatchObject({
      code: 'AUTH_NO_TENANT',
    });
  });

  it('denies when the member lacks a required permission (403)', async () => {
    const guard = new RbacGuard(reflector, jwt, rbac);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) =>
        key === 'nexus:requiredPermissions' ? ['iam.roles.read'] : false,
      );
    rbac.getEffectivePermissions = jest.fn().mockResolvedValue(['org.read']);

    const tok = await sign({ sub: 'u1', orgId: 'o1', email: 'u@x.co' });
    await expect(guard.canActivate(ctxFor({ authorization: `Bearer ${tok}` }))).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('allows when the member holds every required permission', async () => {
    const guard = new RbacGuard(reflector, jwt, rbac);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: unknown) =>
        key === 'nexus:requiredPermissions' ? ['iam.roles.read'] : false,
      );
    rbac.getEffectivePermissions = jest.fn().mockResolvedValue(['iam.roles.read', 'org.read']);

    const tok = await sign({ sub: 'u1', orgId: 'o1', email: 'u@x.co' });
    await expect(guard.canActivate(ctxFor({ authorization: `Bearer ${tok}` }))).resolves.toBe(true);
  });
});

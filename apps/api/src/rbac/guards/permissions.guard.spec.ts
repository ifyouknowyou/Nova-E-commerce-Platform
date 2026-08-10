import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { PermissionsGuard } from './permissions.guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCtx(roleCodes: string[]): any {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { roleCodes } }) }),
  };
}

describe('PermissionsGuard', () => {
  const getAllAndOverride = jest.fn();
  const getPermissionsForRoles = jest.fn();
  const reflector = { getAllAndOverride } as unknown as Reflector;
  const rbac = { getPermissionsForRoles } as unknown as RbacService;
  let guard: PermissionsGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PermissionsGuard(reflector, rbac);
  });

  it('allows when no permissions are required', async () => {
    getAllAndOverride.mockReturnValue(undefined);
    await expect(guard.canActivate(makeCtx(['CUSTOMER']))).resolves.toBe(true);
  });

  it('allows when the user holds every required permission', async () => {
    getAllAndOverride.mockReturnValue(['products:read', 'cart:manage']);
    getPermissionsForRoles.mockResolvedValue(['products:read', 'cart:manage', 'orders:read']);

    await expect(guard.canActivate(makeCtx(['CUSTOMER']))).resolves.toBe(true);
    expect(getPermissionsForRoles).toHaveBeenCalledWith(['CUSTOMER']);
  });

  it('forbids when any required permission is missing', async () => {
    getAllAndOverride.mockReturnValue(['products:create']);
    getPermissionsForRoles.mockResolvedValue(['products:read']);

    await expect(guard.canActivate(makeCtx(['CUSTOMER']))).rejects.toBeInstanceOf(ForbiddenException);
  });
});

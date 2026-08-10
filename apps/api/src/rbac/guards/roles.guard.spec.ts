import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCtx(roleCodes: string[]): any {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { roleCodes } }) }),
  };
}

describe('RolesGuard', () => {
  const getAllAndOverride = jest.fn();
  const reflector = { getAllAndOverride } as unknown as Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles are required', () => {
    getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeCtx(['CUSTOMER']))).toBe(true);
  });

  it('allows when the user holds a required role', () => {
    getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(guard.canActivate(makeCtx(['ADMIN']))).toBe(true);
  });

  it('forbids when the user lacks the required role', () => {
    getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(makeCtx(['CUSTOMER']))).toThrow(ForbiddenException);
  });
});

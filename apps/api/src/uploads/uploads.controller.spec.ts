import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../rbac/decorators/roles.decorator';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { UploadsController } from './uploads.controller';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCtx(roleCodes: string[]): any {
  return {
    getHandler: () => UploadsController.prototype.uploadImage,
    getClass: () => UploadsController,
    switchToHttp: () => ({ getRequest: () => ({ user: { roleCodes } }) }),
  };
}

describe('UploadsController role restriction (H9)', () => {
  const reflector = new Reflector();

  it('annotates uploadImage with @Roles(SELLER, ADMIN)', () => {
    const required = reflector.get(ROLES_KEY, UploadsController.prototype.uploadImage);
    expect(required).toEqual(['SELLER', 'ADMIN']);
  });

  it('denies a CUSTOMER upload (403)', () => {
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(makeCtx(['CUSTOMER']))).toThrow(ForbiddenException);
  });

  it('denies an unauthenticated upload (no roles)', () => {
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(makeCtx([]))).toThrow(ForbiddenException);
  });

  it('allows a SELLER upload', () => {
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeCtx(['SELLER']))).toBe(true);
  });

  it('allows an ADMIN upload', () => {
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeCtx(['ADMIN']))).toBe(true);
  });
});

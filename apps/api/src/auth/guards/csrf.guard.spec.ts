import { ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCtx(method: string, cookie: string | undefined, csrfHeader: string | undefined): any {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, headers: { ...(cookie ? { cookie } : {}), ...(csrfHeader ? { 'x-csrf-token': csrfHeader } : {}) } }),
    }),
  };
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  it('ignores safe methods', () => {
    expect(guard.canActivate(makeCtx('GET', 'nova_csrf=abc', undefined))).toBe(true);
  });

  it('allows unsafe methods when no CSRF cookie is present (bearer/non-cookie auth)', () => {
    expect(guard.canActivate(makeCtx('POST', undefined, undefined))).toBe(true);
  });

  it('rejects an unsafe cookie-authenticated request missing the CSRF header', () => {
    expect(() => guard.canActivate(makeCtx('POST', 'nova_csrf=abc', undefined))).toThrow(ForbiddenException);
  });

  it('rejects an unsafe request whose CSRF header does not match the cookie', () => {
    expect(() => guard.canActivate(makeCtx('POST', 'nova_csrf=abc', 'wrong'))).toThrow(ForbiddenException);
  });

  it('allows an unsafe request with a matching CSRF header', () => {
    expect(guard.canActivate(makeCtx('POST', 'nova_csrf=abc', 'abc'))).toBe(true);
  });
});
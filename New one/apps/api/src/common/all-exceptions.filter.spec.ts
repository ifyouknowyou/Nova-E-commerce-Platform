import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ApiException } from './exceptions';
import { resolveErrorCode } from '@nexus/shared';

function makeHost(_exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status, json };
  const req = { url: '/test', method: 'GET' };
  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  };
  return { res, status, json, host };
}

describe('AllExceptionsFilter — canonical error shape (Decision 2)', () => {
  const filter = new AllExceptionsFilter();

  it('renders ApiException with its stable code + status', () => {
    const { res, host } = makeHost(null);
    filter.catch(new ApiException('FORBIDDEN'), host as never);

    const def = resolveErrorCode('FORBIDDEN');
    expect(res.status).toHaveBeenCalledWith(def.httpStatus);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: def.httpStatus,
      code: 'FORBIDDEN',
      message: def.message,
    });
  });

  it('maps a generic HttpException to the canonical shape', () => {
    const { res, host } = makeHost(null);
    filter.catch(new HttpException('nope', HttpStatus.UNAUTHORIZED), host as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 401,
      code: 'AUTH_UNAUTHENTICATED',
      message: 'nope',
    });
  });

  it('never leaks internals for unhandled errors — returns INTERNAL_ERROR', () => {
    const { res, host } = makeHost(null);
    filter.catch(new Error('secret db password'), host as never);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.message).toBe(resolveErrorCode('INTERNAL_ERROR').message);
    expect(JSON.stringify(body)).not.toContain('secret');
  });
});

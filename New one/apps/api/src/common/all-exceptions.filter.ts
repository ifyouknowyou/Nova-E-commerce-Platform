import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorEnvelope, HTTP_STATUS, resolveErrorCode } from '@nexus/shared';

/**
 * Global exception filter — the ONLY place HTTP errors are shaped.
 * Every response (success or error) is consistent, and every error carries a
 * stable code from ERROR_CODES (upgrade Decision 2).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ url?: string; method?: string }>();

    if (exception instanceof HttpException && exception.getStatus() < 500) {
      // Known client errors: honor the code if it came from ApiException,
      // otherwise map the built-in Nest error onto the canonical shape.
      const status = exception.getStatus();
      const body = exception.getResponse() as
        | { statusCode?: number; code?: string; message?: string | string[]; details?: unknown }
        | string;

      let code = 'VALIDATION_FAILED';
      const message =
        typeof body === 'string' ? body : Array.isArray(body?.message) ? body.message.join(', ') : (body?.message ?? exception.message);
      let details: unknown;

      if (typeof body === 'object' && body?.code) {
        code = body.code;
      } else if (status === HttpStatus.UNAUTHORIZED) {
        code = 'AUTH_UNAUTHENTICATED';
      } else if (status === HttpStatus.FORBIDDEN) {
        code = 'FORBIDDEN';
      } else if (status === HttpStatus.NOT_FOUND) {
        code = 'NOT_FOUND';
      } else if (status === HttpStatus.CONFLICT) {
        code = 'CONFLICT';
      }
      if (typeof body === 'object' && body?.details !== undefined) details = body.details;

      const envelope: ApiErrorEnvelope = { statusCode: status, code, message, ...(details !== undefined ? { details } : {}) };
      res.status(status).json(envelope);
      return;
    }

    // Unhandled: internal error. Never leak stack/details to the client.
    this.logger.error(
      `Unhandled exception on ${req.method ?? '?'} ${req.url ?? '?'}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    const def = resolveErrorCode('INTERNAL_ERROR');
    const envelope: ApiErrorEnvelope = {
      statusCode: HTTP_STATUS.InternalServerError,
      code: def.code,
      message: def.message,
    };
    res.status(HTTP_STATUS.InternalServerError).json(envelope);
  }
}
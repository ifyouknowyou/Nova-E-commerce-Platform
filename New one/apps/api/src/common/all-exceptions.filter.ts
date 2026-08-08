import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ApiErrorEnvelope, HTTP_STATUS, resolveErrorCode } from '@nexus/shared';
import { ObservabilityService } from '../observability/observability.service';

/**
 * Global exception filter — the ONLY place HTTP errors are shaped.
 * Every response (success or error) is consistent, and every error carries a
 * stable code from ERROR_CODES (upgrade Decision 2). Unhandled (≥500) errors are
 * forwarded to ObservabilityService so they're tracked alongside metrics.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly obs?: ObservabilityService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ url?: string; method?: string; user?: { orgId: string } }>();

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

    // Prisma known-request errors: map database constraint/not-found failures to
    // the canonical 4xx codes instead of leaking a generic 500. (Auth/sign-up and
    // fresh-org flows rely on CONFLICT for P2002; AI/approval not-found uses P2025.)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaCode = exception.code;
      let status: number;
      let code: string;
      let message: string;
      if (prismaCode === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'CONFLICT';
        message = 'Resource already exists or conflicts with an existing record.';
      } else if (prismaCode === 'P2003') {
        status = HttpStatus.CONFLICT;
        code = 'CONFLICT';
        message = 'Record is still referenced by other data.';
      } else if (prismaCode === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = resolveErrorCode('NOT_FOUND').message;
      } else if (prismaCode === 'P2014' || prismaCode === 'P2000' || prismaCode === 'P2004') {
        status = HttpStatus.BAD_REQUEST;
        code = 'VALIDATION_FAILED';
        message = 'Data constraint failed.';
      } else {
        // Any other Prisma error is genuinely unexpected — surface as 500.
        this.logger.error(
          `Prisma error ${prismaCode} on ${req.method ?? '?'} ${req.url ?? '?'}: ${exception.message}`,
          exception.stack,
        );
        void this.obs?.recordError({
          orgId: req.user?.orgId,
          code: resolveErrorCode('INTERNAL_ERROR').code,
          statusCode: HTTP_STATUS.InternalServerError,
          requestMethod: req.method,
          requestUrl: req.url,
          message: exception.message,
          stack: exception.stack,
        });
        res.status(HTTP_STATUS.InternalServerError).json({
          statusCode: HTTP_STATUS.InternalServerError,
          code: resolveErrorCode('INTERNAL_ERROR').code,
          message: resolveErrorCode('INTERNAL_ERROR').message,
        });
        return;
      }

      this.logger.warn(`Prisma constraint (${prismaCode}) on ${req.method ?? '?'} ${req.url ?? '?'}`);
      res.status(status).json({ statusCode: status, code, message });
      return;
    }

    // Unhandled: internal error. Stream to observability. Never leak stack/details.
    this.logger.error(
      `Unhandled exception on ${req.method ?? '?'} ${req.url ?? '?'}: ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );
    void this.obs?.recordError({
      orgId: req.user?.orgId,
      code: resolveErrorCode('INTERNAL_ERROR').code,
      statusCode: HTTP_STATUS.InternalServerError,
      requestMethod: req.method,
      requestUrl: req.url,
      message: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    });
    const def = resolveErrorCode('INTERNAL_ERROR');
    const envelope: ApiErrorEnvelope = {
      statusCode: HTTP_STATUS.InternalServerError,
      code: def.code,
      message: def.message,
    };
    res.status(HTTP_STATUS.InternalServerError).json(envelope);
  }
}
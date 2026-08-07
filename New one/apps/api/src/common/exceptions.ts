import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorEnvelope, ErrorCode, resolveErrorCode } from '@nexus/shared';

/**
 * NEXUS OS — the single exception type controllers throw.
 * Takes a stable ERROR_CODES code (never an ad-hoc string) + optional detail.
 */
export class ApiException extends HttpException {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: ErrorCode, details?: unknown) {
    const def = resolveErrorCode(code);
    const envelope: ApiErrorEnvelope = {
      statusCode: def.httpStatus,
      code: def.code,
      message: def.message,
      ...(details !== undefined ? { details } : {}),
    };
    super(envelope, def.httpStatus as HttpStatus);
    this.code = def.code;
    this.details = details;
  }
}
/**
 * NEXUS OS — HTTP error contract (upgrade Decision 2).
 *
 * Every API error returns the canonical shape `{ statusCode, code, message, details }`
 * with a stable, searchable machine code from this map. Controllers never invent
 * codes ad hoc — they throw `ApiException` with a known code (see apps/api).
 * The web `apiFetch` parses exactly this shape.
 */

/** Canonical error envelope returned by the global exception filter. */
export interface ApiErrorEnvelope {
  statusCode: number;
  /** Stable machine code, e.g. `AUTH_INVALID_CREDENTIALS`. */
  code: string;
  /** Human-readable message. */
  message: string;
  /** Optional structured detail (validation field errors, etc.). */
  details?: unknown;
}

export interface ErrorCodeDef {
  code: string;
  httpStatus: number;
  message: string;
}

export const HTTP_STATUS = {
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  Unprocessable: 422,
  TooManyRequests: 429,
  InternalServerError: 500,
} as const;

export const ERROR_CODES: Record<string, ErrorCodeDef> = {
  // Auth / session
  AUTH_INVALID_CREDENTIALS: { code: 'AUTH_INVALID_CREDENTIALS', httpStatus: 401, message: 'Invalid credentials.' },
  AUTH_UNAUTHENTICATED: { code: 'AUTH_UNAUTHENTICATED', httpStatus: 401, message: 'Authentication required.' },
  AUTH_NO_TENANT: { code: 'AUTH_NO_TENANT', httpStatus: 403, message: 'No organization context for this session.' },
  SESSION_EXPIRED: { code: 'SESSION_EXPIRED', httpStatus: 401, message: 'Session expired. Please sign in again.' },
  AUTH_EMAIL_TAKEN: { code: 'AUTH_EMAIL_TAKEN', httpStatus: 409, message: 'An account with this email already exists.' },
  AUTH_EMAIL_NOT_VERIFIED: { code: 'AUTH_EMAIL_NOT_VERIFIED', httpStatus: 403, message: 'Please verify your email address first.' },
  AUTH_TOKEN_INVALID: { code: 'AUTH_TOKEN_INVALID', httpStatus: 400, message: 'That link is invalid or has already been used.' },
  AUTH_TOKEN_EXPIRED: { code: 'AUTH_TOKEN_EXPIRED', httpStatus: 400, message: 'That link has expired. Please request a new one.' },
  AUTH_PASSWORD_WEAK: { code: 'AUTH_PASSWORD_WEAK', httpStatus: 422, message: 'Password does not meet the policy.' },
  AUTH_PASSWORD_MISMATCH: { code: 'AUTH_PASSWORD_MISMATCH', httpStatus: 422, message: 'Passwords do not match.' },
  AUTH_REFRESH_INVALID: { code: 'AUTH_REFRESH_INVALID', httpStatus: 401, message: 'Refresh session is invalid or expired.' },

  // Authorization
  FORBIDDEN: { code: 'FORBIDDEN', httpStatus: 403, message: 'You do not have permission to perform this action.' },
  RBAC_ROLE_UNKNOWN: { code: 'RBAC_ROLE_UNKNOWN', httpStatus: 403, message: 'Role is not recognized in this organization.' },
  TENANT_FORBIDDEN: { code: 'TENANT_FORBIDDEN', httpStatus: 404, message: 'Resource not found.' },
  CSRF_INVALID: { code: 'CSRF_INVALID', httpStatus: 403, message: 'Invalid or missing CSRF token.' },

  // Organizations
  ORG_SLUG_TAKEN: { code: 'ORG_SLUG_TAKEN', httpStatus: 409, message: 'That organization slug is already taken.' },
  ORG_NOT_FOUND: { code: 'ORG_NOT_FOUND', httpStatus: 404, message: 'Organization not found.' },
  ORG_INVITE_INVALID: { code: 'ORG_INVITE_INVALID', httpStatus: 400, message: 'That invite is invalid or already used.' },
  ORG_INVITE_EXPIRED: { code: 'ORG_INVITE_EXPIRED', httpStatus: 400, message: 'That invite has expired.' },

  // Settings
  SETTINGS_READONLY: { code: 'SETTINGS_READONLY', httpStatus: 403, message: 'This setting is read-only for your role.' },

  // Validation / resource
  VALIDATION_FAILED: { code: 'VALIDATION_FAILED', httpStatus: 422, message: 'Validation failed.' },
  NOT_FOUND: { code: 'NOT_FOUND', httpStatus: 404, message: 'Resource not found.' },
  CONFLICT: { code: 'CONFLICT', httpStatus: 409, message: 'Resource already exists or conflicts.' },
  RATE_LIMITED: { code: 'RATE_LIMITED', httpStatus: 429, message: 'Too many requests. Please slow down.' },

  // Unexpected
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', httpStatus: 500, message: 'An unexpected error occurred.' },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export function resolveErrorCode(code: string): ErrorCodeDef {
  return ERROR_CODES[code] ?? ERROR_CODES.INTERNAL_ERROR!;
}
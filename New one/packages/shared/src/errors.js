"use strict";
/**
 * NEXUS OS — HTTP error contract (upgrade Decision 2).
 *
 * Every API error returns the canonical shape `{ statusCode, code, message, details }`
 * with a stable, searchable machine code from this map. Controllers never invent
 * codes ad hoc — they throw `ApiException` with a known code (see apps/api).
 * The web `apiFetch` parses exactly this shape.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.HTTP_STATUS = void 0;
exports.resolveErrorCode = resolveErrorCode;
exports.HTTP_STATUS = {
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    Conflict: 409,
    Unprocessable: 422,
    TooManyRequests: 429,
    InternalServerError: 500,
};
exports.ERROR_CODES = {
    // Auth / session (Phase 2 full flows; minimal in Phase 1)
    AUTH_INVALID_CREDENTIALS: { code: 'AUTH_INVALID_CREDENTIALS', httpStatus: 401, message: 'Invalid credentials.' },
    AUTH_UNAUTHENTICATED: { code: 'AUTH_UNAUTHENTICATED', httpStatus: 401, message: 'Authentication required.' },
    AUTH_NO_TENANT: { code: 'AUTH_NO_TENANT', httpStatus: 403, message: 'No organization context for this session.' },
    SESSION_EXPIRED: { code: 'SESSION_EXPIRED', httpStatus: 401, message: 'Session expired. Please sign in again.' },
    // Authorization
    FORBIDDEN: { code: 'FORBIDDEN', httpStatus: 403, message: 'You do not have permission to perform this action.' },
    RBAC_ROLE_UNKNOWN: { code: 'RBAC_ROLE_UNKNOWN', httpStatus: 403, message: 'Role is not recognized in this organization.' },
    TENANT_FORBIDDEN: { code: 'TENANT_FORBIDDEN', httpStatus: 404, message: 'Resource not found.' },
    // Validation / resource
    VALIDATION_FAILED: { code: 'VALIDATION_FAILED', httpStatus: 422, message: 'Validation failed.' },
    NOT_FOUND: { code: 'NOT_FOUND', httpStatus: 404, message: 'Resource not found.' },
    CONFLICT: { code: 'CONFLICT', httpStatus: 409, message: 'Resource already exists or conflicts.' },
    RATE_LIMITED: { code: 'RATE_LIMITED', httpStatus: 429, message: 'Too many requests. Please slow down.' },
    // Unexpected
    INTERNAL_ERROR: { code: 'INTERNAL_ERROR', httpStatus: 500, message: 'An unexpected error occurred.' },
};
function resolveErrorCode(code) {
    return exports.ERROR_CODES[code] ?? exports.ERROR_CODES.INTERNAL_ERROR;
}
//# sourceMappingURL=errors.js.map
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
export declare const HTTP_STATUS: {
    readonly BadRequest: 400;
    readonly Unauthorized: 401;
    readonly Forbidden: 403;
    readonly NotFound: 404;
    readonly Conflict: 409;
    readonly Unprocessable: 422;
    readonly TooManyRequests: 429;
    readonly InternalServerError: 500;
};
export declare const ERROR_CODES: Record<string, ErrorCodeDef>;
export type ErrorCode = keyof typeof ERROR_CODES;
export declare function resolveErrorCode(code: string): ErrorCodeDef;
//# sourceMappingURL=errors.d.ts.map
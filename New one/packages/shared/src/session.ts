/**
 * NEXUS OS — session/cookie contract (Phase 2 auth).
 * The API sets these httpOnly cookies; the web client reads CSRF + sends the
 * token header on state-changing requests.
 */

/** Access cookie — short-lived (default 15m), httpOnly, SameSite=Lax. */
export const ACCESS_COOKIE = 'nexus_access';
/** Refresh cookie — longer-lived, httpOnly, SameSite=Lax. */
export const REFRESH_COOKIE = 'nexus_refresh';
/** CSRF token cookie — NOT httpOnly (readable by JS), SameSite=Lax. */
export const CSRF_COOKIE = 'nexus_csrf';
/** Header the client must echo for state-changing requests. */
export const CSRF_HEADER = 'x-csrf-token';

export const ACCESS_COOKIE_TTL_MS = 15 * 60 * 1000; // 15m
export const REFRESH_COOKIE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d
export const REFRESH_TOKEN_TTL_DAYS = 30;

import { randomBytes } from 'node:crypto';
import type { Response } from 'express';
import type { AppConfig } from '../config/configuration';

export const ACCESS_COOKIE = 'nova_access';
export const REFRESH_COOKIE = 'nova_refresh';
/** Non-httpOnly marker so the client can detect an active session without reading the token. */
export const AUTH_MARKER_COOKIE = 'nova_authed';
/** Double-submit CSRF token (non-httpOnly so the SPA can echo it back). */
export const CSRF_COOKIE = 'nova_csrf';

export function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])?$/.exec(ttl.trim());
  if (!match) return 24 * 3600;
  const value = Number(match[1]);
  switch (match[2]) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return value;
  }
}

function base(res: Response, config: AppConfig) {
  return {
    sameSite: 'lax' as const,
    secure: config.env === 'production',
    path: '/',
  };
}

/** Set the httpOnly access/refresh cookies plus the CSRF + auth-marker cookies. */
export function setAuthCookies(
  res: Response,
  config: AppConfig,
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean,
): void {
  const b = base(res, config);
  res.cookie(ACCESS_COOKIE, accessToken, { ...b, httpOnly: true, maxAge: ttlToSeconds(config.jwtAccessTtl) * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...b,
    httpOnly: true,
    maxAge: ttlToSeconds(rememberMe ? config.jwtRefreshTtl : config.jwtSessionTtl) * 1000,
  });
  // Non-httpOnly cookies the SPA is allowed to read.
  const sessionMs = ttlToSeconds(rememberMe ? config.jwtRefreshTtl : config.jwtSessionTtl) * 1000;
  res.cookie(AUTH_MARKER_COOKIE, '1', { ...b, httpOnly: false, maxAge: sessionMs });
  res.cookie(CSRF_COOKIE, randomBytes(32).toString('base64url'), { ...b, httpOnly: false, maxAge: sessionMs });
}

/** Clear every auth cookie (logout / logout-all). */
export function clearAuthCookies(res: Response, config: AppConfig): void {
  const b = base(res, config);
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, AUTH_MARKER_COOKIE, CSRF_COOKIE]) {
    res.clearCookie(name, { ...b, httpOnly: name === ACCESS_COOKIE || name === REFRESH_COOKIE });
  }
}

/** Minimal Cookie-header parser (avoids the cookie-parser dependency). */
export function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

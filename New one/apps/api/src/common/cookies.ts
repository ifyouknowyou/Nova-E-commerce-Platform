import { Response } from 'express';
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_TTL_MS,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_TTL_MS,
} from '@nexus/shared';

const BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function setSessionCookies(res: Response, accessToken: string, refreshToken: string, csrf: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, { ...BASE, maxAge: ACCESS_COOKIE_TTL_MS });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...BASE, maxAge: REFRESH_COOKIE_TTL_MS });
  // CSRF cookie is intentionally NOT httpOnly (client JS reads it to echo the header).
  res.cookie(CSRF_COOKIE, csrf, { ...BASE, httpOnly: false, maxAge: ACCESS_COOKIE_TTL_MS });
}

export function clearSessionCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...BASE });
  res.clearCookie(REFRESH_COOKIE, { ...BASE });
  res.clearCookie(CSRF_COOKIE, { ...BASE });
}

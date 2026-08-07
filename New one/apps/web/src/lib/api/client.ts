import { CSRF_COOKIE, CSRF_HEADER } from '@nexus/shared';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const value = match?.[1];
  return value === undefined ? undefined : decodeURIComponent(value);
}

function csrfToken(method: string): Record<string, string> {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return {};
  const csrf = readCookie(CSRF_COOKIE);
  return csrf ? { [CSRF_HEADER]: csrf } : {};
}

/** Shared fetch wrapper: JSON in/out, httpOnly-cookie auth, CSRF header. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...csrfToken(init.method ?? 'GET'),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: { code?: string; message?: string; details?: unknown } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, body.code ?? 'REQUEST_FAILED', body.message ?? `Request failed (${res.status})`, body.details);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Base URL for the NOVA REST API. In the browser, calls are made from the
 * client (e.g. checkout, cart). In RSC/server components the API is called
 * from the server via the internal URL.
 */
export const API_URL =
  (typeof window === 'undefined'
    ? `${process.env.API_INTERNAL_URL ?? 'http://localhost:4000'}/api`
    : process.env.NEXT_PUBLIC_API_URL) ?? 'http://localhost:4000/api';

/** Fired after a product is deleted/archived so open storefront tabs drop it from cached lists. */
export const PRODUCTS_CHANGE_EVENT = 'nova:products-change';

export function notifyProductsChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRODUCTS_CHANGE_EVENT));
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const TOKEN_KEY = 'nova_access_token';

/**
 * Auth now lives in httpOnly cookies set by the API (see auth/cookies.ts), so
 * the access token is NOT readable from browser JS. These accessors are kept as
 * a non-functional backward-compat surface; the fetch layer relies on cookies.
 */
export function getAccessToken(): string {
  return '';
}
export function setAccessToken(_token: string): void {
  // no-op — tokens are httpOnly cookies managed by the server
}
export function clearAccessToken(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

/** Read a single browser cookie by name. */
export function getCookie(name: string): string {
  if (typeof window === 'undefined') return '';
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

/** Cross-site CSRF token written by the API as a non-httpOnly cookie. */
function csrfToken(): string {
  return getCookie('nova_csrf');
}

/** Add double-submit CSRF protection for cookie-authenticated mutations in the browser. */
function csrfHeaders(method?: string): Record<string, string> {
  const m = (method ?? 'GET').toUpperCase();
  if (typeof window === 'undefined') return {}; // no CSRF for server-side fetches
  if (['GET', 'HEAD', 'OPTIONS'].includes(m)) return {};
  const csrf = csrfToken();
  return csrf ? { 'X-CSRF-Token': csrf } : {};
}

/** Endpoints that must not trigger the auto-refresh retry (they ARE the refresh path). */
const AUTH_REFRESH_EXCLUDED = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/logout-all',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/change-password',
  '/auth/oauth/exchange',
];

type ApiRequestInit = RequestInit & {
  // Next.js fetch-cache controls (only honored in RSC/server contexts).
  next?: { revalidate?: number; tags?: string[] };
};

async function request(path: string, init?: ApiRequestInit): Promise<Response> {
  const token = typeof window !== 'undefined' ? getAccessToken() : '';
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...csrfHeaders(init?.method),
      ...(init?.headers ?? {}),
    },
  });
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: { message?: string; code?: string; details?: unknown } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      // non-JSON error body — fall through with defaults
    }
    throw new ApiError(res.status, body.message ?? `Request failed (${res.status})`, body.code, body.details);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Shared fetch wrapper: JSON in/out, consistent error shape, auth via httpOnly cookie. */
export async function apiFetch<T>(path: string, init?: ApiRequestInit): Promise<T> {
  let res = await request(path, init);
  // Access cookie expired? Rotate the refresh cookie once and retry, so an
  // expired token self-heals without a manual re-login.
  if (res.status === 401 && typeof window !== 'undefined' && !AUTH_REFRESH_EXCLUDED.includes(path)) {
    const refreshRes = await request('/auth/refresh', { method: 'POST', body: JSON.stringify({}) });
    if (refreshRes.ok) res = await request(path, init);
  }
  return parseResponse<T>(res);
}

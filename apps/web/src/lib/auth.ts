'use client';

import { apiFetch, clearAccessToken } from '@/lib/api';
import { getQueryClient } from '@/lib/query-client';

/** Emitted whenever the auth token changes so mounted hooks can re-read it. */
const AUTH_CHANGE_EVENT = 'nova:auth-change';

/** Notify every mounted useAuthenticated() to re-read the stored token. */
export function notifyAuthChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

const REFRESH_KEY = 'nova_refresh_token';
/** Non-"remember me" sessions live here so they clear when the tab closes. */
const SESSION_REFRESH_KEY = 'nova_session_refresh_token';

// NOTE: tokens are now httpOnly cookies set by the API. The storage accessors
// below are retained only to clear legacy leftovers from before the migration.

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  emailVerified: boolean;
  roles: string[];
}

interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

/**
 * Auth is now cookie-based: the server sets the httpOnly access + refresh
 * cookies (and the non-httpOnly `nova_authed` marker). The client no longer
 * stores tokens. We clear any legacy storage leftovers and notify mounted hooks
 * that the session changed.
 */
function persist(result: AuthResult, _rememberMe?: boolean): AuthUser {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(REFRESH_KEY);
    window.sessionStorage.removeItem(SESSION_REFRESH_KEY);
    notifyAuthChange();
  }
  return result.user;
}

/**
 * Wipe all auth state after signing out: drop the stored tokens, clear every
 * cached query so the previous account's data never leaks to the next session,
 * and notify mounted hooks that auth changed.
 */
function clearAuthState(): void {
  clearAccessToken();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(REFRESH_KEY);
    window.sessionStorage.removeItem(SESSION_REFRESH_KEY);
    getQueryClient().clear();
    notifyAuthChange();
  }
}

export const authApi = {
  async register(input: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    accountType?: 'CUSTOMER' | 'SELLER';
    storeName?: string;
  }): Promise<{ message: string; email: string }> {
    return apiFetch<{ message: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async login(email: string, password: string, rememberMe = false): Promise<AuthUser> {
    const result = await apiFetch<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    return persist(result, rememberMe);
  },

  /** The refresh token is an httpOnly cookie — not readable by JS. */
  getRefreshToken(): string {
    return '';
  },

  /**
   * Rotate the refresh session. The server reads the httpOnly refresh cookie
   * and re-issues access + refresh cookies. Picks up role changes.
   */
  async refresh(): Promise<AuthUser | null> {
    try {
      const result = await apiFetch<AuthResult>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      return persist(result);
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    // Clear local state first so the UI signs out immediately, then revoke the
    // refresh session + clear cookies on the server best-effort (never block
    // logout on network). The server reads the httpOnly refresh cookie itself.
    clearAuthState();
    await apiFetch<never>('/auth/logout', { method: 'POST', body: JSON.stringify({}) }).catch(() => undefined);
  },

  /** Sign out on every device (revokes all refresh sessions). */
  async logoutAll(): Promise<void> {
    clearAuthState();
    await apiFetch<{ message: string }>('/auth/logout-all', { method: 'POST' }).catch(() => undefined);
  },

  changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  verifyEmail(code: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ code }) });
  },

  resendVerification(email: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
  },

  forgotPassword(email: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },

  resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
  },

  async exchangeOAuth(code: string): Promise<AuthUser> {
    const result = await apiFetch<AuthResult>('/auth/oauth/exchange', { method: 'POST', body: JSON.stringify({ code }) });
    return persist(result, true);
  },
};
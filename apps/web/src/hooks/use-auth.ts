'use client';

import { useEffect, useState } from 'react';
import { apiFetch, getCookie } from '@/lib/api';

/**
 * Non-httpOnly marker cookie the API sets on login (see apps/api auth/cookies.ts).
 * It exists precisely so the browser can detect an active session without
 * reading the httpOnly access token — and without a network round-trip.
 */
const AUTH_MARKER_COOKIE = 'nova_authed';

export interface AuthState {
  /** Whether the user has a stored access token. */
  authed: boolean;
  /** True once the app has re-read auth state after hydration. */
  ready: boolean;
  /** Role codes for the authenticated user (e.g. ADMIN, SELLER). */
  roles: string[];
}

/**
 * Determines auth state from the `nova_authed` marker cookie (set by the API on
 * login, cleared on logout) and enriches it with role codes from /auth/me.
 *
 * Using the marker cookie — rather than treating /auth/me as the source of
 * truth — avoids the logged-in-but-shows-"Sign in" race/edge case where the
 * network probe fails (cross-origin cookie quirks, transient errors) and the
 * UI wrongly flips to the anonymous state.
 */
export function useAuthenticated(): AuthState {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    async function sync(): Promise<void> {
      // Marker cookie is the authoritative "are we logged in" signal.
      const hasSession = !!getCookie(AUTH_MARKER_COOKIE);
      setAuthed(hasSession);

      if (hasSession) {
        try {
          const user = await apiFetch<{ id: string; email: string; roles?: string[] }>('/auth/me');
          setRoles(user?.roles ?? []);
        } catch {
          setRoles([]);
        }
      } else {
        setRoles([]);
      }
      setReady(true);
    }

    sync();
    window.addEventListener('nova:auth-change', sync);
    return () => window.removeEventListener('nova:auth-change', sync);
  }, []);

  return { authed, ready, roles };
}

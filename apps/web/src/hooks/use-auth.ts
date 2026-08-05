'use client';

import { useEffect, useState } from 'react';
import { getCookie } from '@/lib/api';

export interface AuthState {
  /** Whether the user has a stored access token. */
  authed: boolean;
  /** True once the app has re-read auth state after hydration. */
  ready: boolean;
}

/**
 * Reads authentication state only after hydration, and re-reads it whenever
 * the auth cookie changes (login/logout) via the `nova:auth-change` event.
 *
 * Auth now lives in httpOnly cookies. The server sets a non-httpOnly
 * `nova_authed` marker cookie that this hook reads; the marker only exists in
 * the browser, so both renders agree until mount (hydration-safe).
 */
export function useAuthenticated(): AuthState {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync(): void {
      setAuthed(getCookie('nova_authed') === '1');
      setReady(true);
    }

    sync();
    window.addEventListener('nova:auth-change', sync);
    return () => window.removeEventListener('nova:auth-change', sync);
  }, []);

  return { authed, ready };
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface AuthState {
  /** Whether the user has a stored access token. */
  authed: boolean;
  /** True once the app has re-read auth state after hydration. */
  ready: boolean;
}

/**
 * Reads authentication state via the /api/auth/me endpoint.
 * This works across domains (Vercel frontend → Render API) because it
 * uses the API's CORS-enabled endpoint instead of reading cookies directly.
 */
export function useAuthenticated(): AuthState {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function sync(): Promise<void> {
      try {
        const user = await apiFetch('/auth/me');
        setAuthed(user !== null);
      } catch {
        setAuthed(false);
      }
      setReady(true);
    }

    sync();
    window.addEventListener('nova:auth-change', sync);
    return () => window.removeEventListener('nova:auth-change', sync);
  }, []);

  return { authed, ready };
}

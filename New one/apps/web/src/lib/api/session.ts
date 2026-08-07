'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from './client';

export interface SessionUser {
  userId: string;
  orgId: string;
  roles: string[];
  email: string;
  emailVerified: boolean;
}

export interface SessionState {
  loading: boolean;
  user: SessionUser | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

/** Reads the session (auto-refreshes once on 401). Shared by auth + layout. */
export function useSession(): SessionState {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  async function load(allowRefresh = true): Promise<void> {
    setLoading(true);
    try {
      setUser(await apiFetch<SessionUser>('/auth/me'));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && allowRefresh) {
        try {
          await apiFetch('/auth/refresh', { method: 'POST', body: '{}' });
          setUser(await apiFetch<SessionUser>('/auth/me'));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function signOut(): Promise<void> {
    try {
      await apiFetch('/auth/sign-out', { method: 'POST', body: '{}' });
    } finally {
      setUser(null);
    }
  }

  return { loading, user, refresh: () => load(false), signOut };
}

'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface Health {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  uptime: number;
  timestamp: string;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; health: Health }
  | { kind: 'error'; message: string };

export function ApiStatus() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const health = await apiFetch<Health>('/health');
        if (!cancelled) setState({ kind: 'ok', health });
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: err instanceof ApiError ? err.message : 'API unreachable',
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium">API health</p>
      {state.kind === 'loading' && <p className="mt-2 text-sm text-muted-foreground">Checking…</p>}
      {state.kind === 'ok' && (
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">{state.health.status}</dd>
          <dt className="text-muted-foreground">Database</dt>
          <dd className="font-medium">{state.health.db}</dd>
          <dt className="text-muted-foreground">Uptime (s)</dt>
          <dd className="font-medium">{state.health.uptime}</dd>
        </dl>
      )}
      {state.kind === 'error' && <p className="mt-2 text-sm text-danger">{state.message}</p>}
    </div>
  );
}

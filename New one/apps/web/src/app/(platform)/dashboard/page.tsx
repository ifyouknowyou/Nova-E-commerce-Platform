'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useSession } from '@/lib/api/session';
import styles from '../platform.module.css';

export default function DashboardPage() {
  const { user } = useSession();
  const [org, setOrg] = useState<{ name: string; slug: string; plan: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ name: string; slug: string; plan: string }>('/orgs/current').then(setOrg).catch(() => undefined);
  }, [user]);

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Dashboard</h1>
      <p className={styles.lede}>
        {org ? org.name : 'Your organization'} · plan {org?.plan ?? 'starter'} · signed in as {user?.email}
      </p>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Tenant context</h2>
        <div className={styles.stack}>
          <div className={styles.mono}>orgId: {user?.orgId}</div>
          <div className={styles.mono}>roles: {user?.roles.join(', ')}</div>
          <div className={styles.mono}>email verified: {String(user?.emailVerified)}</div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Phase 2 platform shell</h2>
        <p>
          The shell (sidebar, org switcher, role-gated nav, light/dark tokens, 403/404) is live. Business
          modules for Phases 3–7 hang off this layout.
        </p>
      </div>
    </div>
  );
}

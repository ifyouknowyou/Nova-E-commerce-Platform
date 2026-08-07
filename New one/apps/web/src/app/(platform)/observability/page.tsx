'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable, fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Health {
  db: string; uptimeSeconds: number; errorCount24h: number;
  counters: Record<string, number>;
  executions: Record<string, number>;
  recentErrors: { id: string; code: string; statusCode: number; requestUrl: string | null; message: string; createdAt: string }[];
}

export default function ObservabilityPage() {
  const [h, setH] = useState<Health | null>(null);
  useEffect(() => {
    apiFetch<Health>('/observability/health').then(setH).catch(() => undefined);
  }, []);

  const counters = h ? Object.entries(h.counters) : [];
  const uptimeMin = h ? Math.floor(h.uptimeSeconds / 60) : 0;

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Observability</h1>
      <p className={shell.lede}>Admin health dashboard — persisted errors + metrics.</p>

      <div className={styles.grid}>
        <div className={styles.kpi}><div className={styles.kpiLabel}>Database</div><div className={styles.kpiValue}>{h?.db === 'up' ? 'up' : '…'}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>Uptime (min)</div><div className={styles.kpiValue}>{uptimeMin}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>Errors (24h)</div><div className={styles.kpiValue}>{h?.errorCount24h ?? 0}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>Executions</div><div className={styles.kpiValue}>{JSON.stringify(h?.executions ?? {})}</div></div>
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Counters</h2>
        {counters.length ? counters.map(([name, v]) => (
          <div className={styles.row} key={name}><span>{name}</span><strong>{v}</strong></div>
        )) : <p className={styles.empty}>No metric events yet.</p>}
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Recent errors</h2>
        <DataTable
          columns={[
            { key: 'at', label: 'When', render: (r) => fmtDate(r.createdAt) },
            { key: 'code', label: 'Code', render: (r) => <span className={styles.badge}>{r.code}</span> },
            { key: 'status', label: 'Status', render: (r) => r.statusCode },
            { key: 'url', label: 'URL', render: (r) => r.requestUrl ?? '—' },
            { key: 'msg', label: 'Message', render: (r) => String(r.message).slice(0, 60) },
          ]}
          rows={(h?.recentErrors ?? []) as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable, fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface AuditRow { id: string; action: string; entity: string; entityId: string; actorId: string | null; createdAt: string; }

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [entity, setEntity] = useState('');

  const load = () => {
    apiFetch<{ items: AuditRow[] }>(`/audit${entity ? `?entity=${entity}` : ''}`).then((d) => setRows(d.items)).catch(() => undefined);
  };
  useEffect(() => { void load(); }, [entity]);

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Audit trail</h1>
      <p className={shell.lede}>Tenant-scoped, queryable; not editable/deletable.</p>
      <div className={styles.form}>
        <input className={styles.input} placeholder="Filter by entity (e.g. deal, invoice, task)" value={entity} onChange={(e) => setEntity(e.target.value)} />
      </div>
      <div className={shell.card}>
        <DataTable
          columns={[
            { key: 'at', label: 'When', render: (r) => fmtDate(r.createdAt) },
            { key: 'action', label: 'Action', render: (r) => <span className={styles.badge}>{r.action}</span> },
            { key: 'entity', label: 'Entity', render: (r) => r.entity },
            { key: 'entityId', label: 'Entity ID', render: (r) => String(r.entityId).slice(0, 8) },
            { key: 'actor', label: 'Actor', render: (r) => r.actorId ? String(r.actorId).slice(0, 8) : '—' },
          ]}
          rows={rows as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
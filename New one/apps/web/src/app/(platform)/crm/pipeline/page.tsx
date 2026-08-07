'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable, money } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../../platform.module.css';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

interface Deal { id: string; name: string; value: string; stage: string; probability: number; }

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const load = useCallback(() => {
    apiFetch<{ items: Deal[] }>('/crm/deals?pageSize=100').then((d) => setDeals(d.items)).catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  async function create() {
    await apiFetch('/crm/deals', { method: 'POST', body: JSON.stringify({ name, value: Number(value), stage: 'NEW', probability: 10 }) });
    setName(''); setValue('');
    load();
  }

  async function move(id: string, stage: string) {
    await apiFetch(`/crm/deals/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage }) });
    load();
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>CRM — Deal pipeline</h1>
      <p className={shell.lede}>Move deals through stages; each change logs an activity.</p>

      <div className={styles.form}>
        <input className={styles.input} placeholder="Deal name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={styles.input} placeholder="Value" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        <button className={styles.btn} onClick={create}>Add deal</button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Deal', render: (r) => <strong>{r.name}</strong> },
          { key: 'value', label: 'Value', render: (r) => money(r.value) },
          { key: 'stage', label: 'Stage', render: (r) => <span className={styles.badge}>{r.stage}</span> },
          { key: 'move', label: 'Move', render: (r) => (
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {STAGES.map((s) => (
                <button key={s} className={`${styles.btn} ${styles.select}`} style={{ fontSize: '0.7rem' }} disabled={String(r.stage) === s} onClick={() => move(r.id, s)}>
                  {s.slice(0, 3)}
                </button>
              ))}
            </div>
          ) },
        ]}
        rows={deals as unknown as Record<string, unknown>[]}
      />
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Ticket { id: string; subject: string; status: string; priority: string; createdAt: string; }

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => apiFetch<Ticket[]>('/support/tickets').then(setTickets).catch(() => undefined);
  useEffect(() => { void load(); }, []);

  async function create() {
    try {
      await apiFetch('/support/tickets', { method: 'POST', body: JSON.stringify({ subject, status: 'OPEN', priority: 'MEDIUM' }) });
      setSubject(''); setError(null); load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  async function setStatus(id: string, status: string) {
    await apiFetch(`/support/tickets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Support</h1>
      <p className={shell.lede}>Tickets with status workflow.</p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.form}>
        <input className={styles.input} placeholder="Ticket subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <button className={styles.btn} onClick={create}>Create ticket</button>
      </div>
      <div className={shell.card}>
        <DataTable
          columns={[
            { key: 'subject', label: 'Subject', render: (r) => r.subject },
            { key: 'priority', label: 'Priority', render: (r) => <span className={styles.badge}>{r.priority}</span> },
            { key: 'status', label: 'Status', render: (r) => (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                  <button key={s} className={`${styles.btn} ${styles.select}`} style={{ fontSize: '0.65rem' }} disabled={r.status === s} onClick={() => setStatus(String(r.id), s)}>
                    {s.slice(0, 4)}
                  </button>
                ))}
              </div>
            )},
          ]}
          rows={tickets as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
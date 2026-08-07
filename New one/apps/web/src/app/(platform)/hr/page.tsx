'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Employee { id: string; firstName: string; lastName: string; title: string | null; email: string | null; status: string; }

export default function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', title: '', email: '' });

  const load = () => apiFetch<Employee[]>('/hr/employees').then(setEmployees).catch(() => undefined);
  useEffect(() => { void load(); }, []);

  async function create() {
    await apiFetch('/hr/employees', { method: 'POST', body: JSON.stringify({ ...form, status: 'ACTIVE' }) });
    setForm({ firstName: '', lastName: '', title: '', email: '' });
    load();
  }

  async function setStatus(id: string, status: string) {
    await apiFetch(`/hr/employees/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Team / HR</h1>
      <p className={shell.lede}>Employees and their status.</p>
      <div className={styles.form}>
        <input className={styles.input} placeholder="First name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
        <input className={styles.input} placeholder="Last name" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
        <input className={styles.input} placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <input className={styles.input} placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <button className={styles.btn} onClick={create}>Add employee</button>
      </div>
      <div className={shell.card}>
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
            { key: 'title', label: 'Title', render: (r) => r.title ?? '—' },
            { key: 'email', label: 'Email', render: (r) => r.email ?? '—' },
            { key: 'status', label: 'Status', render: (r) => (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {['ACTIVE', 'ON_LEAVE', 'TERMINATED'].map((s) => (
                  <button key={s} className={`${styles.btn} ${styles.select}`} style={{ fontSize: '0.65rem' }} disabled={r.status === s} onClick={() => setStatus(String(r.id), s)}>
                    {s === 'ON_LEAVE' ? 'LEAVE' : s.slice(0, 4)}
                  </button>
                ))}
              </div>
            )},
          ]}
          rows={employees as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
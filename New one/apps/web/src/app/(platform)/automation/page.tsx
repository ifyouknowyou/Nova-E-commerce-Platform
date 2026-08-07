'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Workflow {
  id: string; name: string; description: string | null; enabled: boolean; triggerType: string;
  conditions: unknown[]; actions: { type: string }[];
}
interface Execution { id: string; status: string; triggerType: string; createdAt: string; error: string | null; }

const TRIGGERS = ['DEAL_WON', 'INVENTORY_LOW', 'STATUS_CHANGED', 'RECORD_CREATED', 'SCHEDULED'];

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [wf, setWf] = useState({ name: '', triggerType: 'DEAL_WON', conditions: '', actions: '' });
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    apiFetch<Workflow[]>('/automation/workflows').then(setWorkflows).catch(() => undefined);
    apiFetch<Execution[]>('/automation/executions').then(setExecutions).catch(() => undefined);
  };
  useEffect(() => { void load(); }, []);

  async function create() {
    setMsg(null);
    try {
      await apiFetch('/automation/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: wf.name, triggerType: wf.triggerType,
          conditions: wf.conditions ? JSON.parse(wf.conditions) : [],
          actions: wf.actions ? JSON.parse(wf.actions) : [{ type: 'NOTIFY', title: 'Notice', body: 'auto' }],
        }),
      });
      setWf({ name: '', triggerType: 'DEAL_WON', conditions: '', actions: '' });
      load();
    } catch (e) {
      setMsg(e instanceof Error ? `Invalid JSON? ${e.message}` : 'Failed');
    }
  }

  async function toggle(id: string) {
    await apiFetch(`/automation/workflows/${id}/toggle`, { method: 'POST', body: '{}' });
    load();
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Automation</h1>
      <p className={shell.lede}>Workflows: trigger → conditions → actions. Every run is logged.</p>
      {msg && <p className={styles.error}>{msg}</p>}

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>New workflow</h2>
        <div className={styles.form}>
          <input className={styles.input} placeholder="Name" value={wf.name} onChange={(e) => setWf((f) => ({ ...f, name: e.target.value }))} />
          <select className={styles.select} value={wf.triggerType} onChange={(e) => setWf((f) => ({ ...f, triggerType: e.target.value }))}>
            {TRIGGERS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className={styles.input} placeholder='conditions JSON e.g. [{"field":"dealValue","op":"gte","value":100}]' value={wf.conditions} onChange={(e) => setWf((f) => ({ ...f, conditions: e.target.value }))} />
          <input className={styles.input} placeholder='actions JSON e.g. [{"type":"NOTIFY","title":"Won","body":"!"}]' value={wf.actions} onChange={(e) => setWf((f) => ({ ...f, actions: e.target.value }))} />
          <button className={styles.btn} onClick={create}>Create</button>
        </div>
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Workflows</h2>
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: (r) => <strong>{r.name}</strong> },
            { key: 'trigger', label: 'Trigger', render: (r) => <span className={styles.badge}>{r.triggerType}</span> },
            { key: 'actions', label: 'Actions', render: (r) => (r.actions as { type: string }[]).map((a) => a.type).join(', ') },
            { key: 'enabled', label: 'Enabled', render: (r) => <span className={r.enabled ? styles.badgeOpen : styles.badge}>{r.enabled ? 'ON' : 'OFF'}</span> },
            { key: 'toggle', label: '', render: (r) => <button className={`${styles.btn} ${styles.select}`} onClick={() => toggle(String(r.id))}>{r.enabled ? 'Disable' : 'Enable'}</button> },
          ]}
          rows={workflows as unknown as Record<string, unknown>[]}
        />
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Executions</h2>
        <DataTable
          columns={[
            { key: 'status', label: 'Status', render: (r) => <span className={r.status === 'SUCCESS' ? styles.badgeDone : styles.badge}>{r.status}</span> },
            { key: 'trigger', label: 'Trigger', render: (r) => r.triggerType },
            { key: 'at', label: 'At', render: (r) => new Date(String(r.createdAt)).toLocaleString() },
            { key: 'err', label: 'Error', render: (r) => r.error ?? '' },
          ]}
          rows={executions as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
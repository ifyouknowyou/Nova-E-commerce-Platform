'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable, fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Project { id: string; name: string; status: string; taskCount: number; milestoneCount: number; endDate: string | null; }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Project[]>('/projects').then(setProjects).catch(() => undefined);
  }, []);

  async function create() {
    try {
      await apiFetch('/projects', { method: 'POST', body: JSON.stringify({ name, status: 'PLANNING' }) });
      setName('');
      setError(null);
      setProjects(await apiFetch<Project[]>('/projects'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function setStatus(id: string, status: string) {
    await apiFetch(`/projects/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    setProjects(await apiFetch<Project[]>('/projects'));
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Projects</h1>
      <p className={shell.lede}>Projects with task/milestone counts and status workflow.</p>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.form}>
        <input className={styles.input} placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={styles.btn} onClick={create}>Create project</button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (r) => <strong>{r.name}</strong> },
          { key: 'tasks', label: 'Tasks', render: (r) => r.taskCount },
          { key: 'milestones', label: 'Milestones', render: (r) => r.milestoneCount },
          { key: 'end', label: 'Due', render: (r) => fmtDate(r.endDate) },
          { key: 'status', label: 'Status', render: (r) => (
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].map((s) => (
                <button key={s} className={`${styles.btn} ${styles.select}`} style={{ fontSize: '0.7rem' }} disabled={r.status === s} onClick={() => setStatus(r.id, s)}>
                  {s.slice(0, 4)}
                </button>
              ))}
            </div>
          ) },
        ]}
        rows={projects as unknown as Record<string, unknown>[]}
      />
    </div>
  );
}
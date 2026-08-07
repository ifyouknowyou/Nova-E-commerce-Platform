'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import styles from '../platform.module.css';

export default function SettingsPage() {
  const [org, setOrg] = useState<Record<string, unknown>>({});
  const [me, setMe] = useState<Record<string, unknown>>({});
  const [orgInput, setOrgInput] = useState('');
  const [meInput, setMeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Record<string, unknown>>('/settings').then(setOrg).catch(() => undefined);
    apiFetch<Record<string, unknown>>('/settings/me').then(setMe).catch(() => undefined);
  }, []);

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault();
    try {
      const [key, ...rest] = orgInput.split('=');
      const value = rest.join('=');
      if (!key) throw new Error('Give a key=value pair');
      setOrg(await apiFetch<Record<string, unknown>>('/settings', { method: 'PATCH', body: JSON.stringify({ [key.trim()]: value }) }));
      setOrgInput('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function saveMe(e: React.FormEvent) {
    e.preventDefault();
    try {
      const [key, ...rest] = meInput.split('=');
      const value = rest.join('=');
      if (!key) throw new Error('Give key=value');
      setMe(await apiFetch<Record<string, unknown>>('/settings/me', { method: 'PATCH', body: JSON.stringify({ [key]: value }) }));
      setMeInput('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Settings</h1>
      <p className={styles.lede}>Organization + personal settings, persisted to the database.</p>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Organization settings</h2>
        <pre className={styles.mono}>{JSON.stringify(org, null, 2)}</pre>
        <form onSubmit={saveOrg} className={styles.stack}>
          <input className={styles.input} placeholder="key=value (e.g. theme=dark)" value={orgInput} onChange={(e) => setOrgInput(e.target.value)} />
          <button className={styles.btn} type="submit">Save org setting</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Personal preferences</h2>
        <pre className={styles.mono}>{JSON.stringify(me, null, 2)}</pre>
        <form onSubmit={saveMe} className={styles.stack}>
          <input className={styles.input} placeholder="key=value (e.g. locale=en)" value={meInput} onChange={(e) => setMeInput(e.target.value)} />
          <button className={styles.btn} type="submit">Save preference</button>
        </form>
      </div>
    </div>
  );
}
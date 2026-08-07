'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import styles from '../platform.module.css';

interface Integration {
  id: string;
  provider: string;
  name: string;
  status: string;
  enabled: boolean;
}

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Integration[]>('/integrations').then(setItems).catch(() => undefined);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/integrations', {
        method: 'POST',
        body: JSON.stringify({ provider: 'WEBHOOK', name: name || 'Webhook', config: { url } }),
      });
      setItems(await apiFetch<Integration[]>('/integrations'));
      setUrl('');
      setName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  }

  async function test(id: string) {
    try {
      const r = await apiFetch<{ ok: boolean; status: number }>(`/integrations/${id}/test`, { method: 'POST', body: '{}' });
      setNotice(`Test webhook -> ${r.ok ? 'OK' : 'FAILED'} (HTTP ${r.status})`);
      setItems(await apiFetch<Integration[]>('/integrations'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    }
  }

  async function remove(id: string) {
    await apiFetch(`/integrations/${id}`, { method: 'DELETE' });
    setItems((i) => i.filter((x) => x.id !== id));
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Integrations</h1>
      <p className={styles.lede}>Connector registry — real webhook pings, no mocked endpoints.</p>
      {error && <p className={styles.error}>{error}</p>}
      {notice && <p className={styles.lede}>{notice}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Add a webhook connector</h2>
        <form onSubmit={create} className={styles.stack}>
          <input className={styles.input} placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={styles.input} placeholder="Target URL (https://…)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button className={styles.btn} type="submit">Add connector</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Connectors</h2>
        {items.map((it) => (
          <div className={styles.row} key={it.id}>
            <div>
              <strong>{it.name}</strong> <span className={styles.mono}>{it.provider}</span>
            </div>
            <div>
              <span className={it.status === 'CONNECTED' ? styles.badgeOk : styles.badge}>{it.status}</span>{' '}
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => test(it.id)}>Test ping</button>{' '}
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => remove(it.id)}>Remove</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div>No connectors yet.</div>}
      </div>
    </div>
  );
}
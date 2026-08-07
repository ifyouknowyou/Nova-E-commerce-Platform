'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Notif { id: string; type: string; title: string; body: string | null; readAt: string | null; createdAt: string; }

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const load = () => apiFetch<Notif[]>('/notifications').then(setItems).catch(() => undefined);
  useEffect(() => { void load(); }, []);

  async function markRead(id: string) {
    await apiFetch(`/notifications/${id}/read`, { method: 'POST', body: '{}' });
    load();
  }
  async function readAll() {
    await apiFetch('/notifications/read-all', { method: 'POST', body: '{}' });
    load();
  }

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className={shell.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className={shell.h1}>Notifications</h1>
        <button className={`${styles.btn} ${styles.select}`} onClick={readAll} disabled={!unread}>Mark all read</button>
      </div>
      <p className={shell.lede}>{unread} unread · {items.length} total</p>

      {items.map((n) => (
        <div key={n.id} className={shell.card} style={{ opacity: n.readAt ? 0.6 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{n.title}</strong>
            <span style={{ display: 'flex', gap: 8 }}>
              <span className={shell.mono}>{fmtDate(n.createdAt)}</span>
              {!n.readAt && <button className={`${styles.btn} ${styles.select}`} onClick={() => markRead(n.id)}>Mark read</button>}
            </span>
          </div>
          {n.body && <p style={{ margin: '0.35rem 0 0' }}>{n.body}</p>}
        </div>
      ))}
      {!items.length && <p className={styles.empty}>No notifications yet.</p>}
    </div>
  );
}
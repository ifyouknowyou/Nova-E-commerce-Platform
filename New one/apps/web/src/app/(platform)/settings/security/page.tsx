'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import styles from '../../platform.module.css';

interface SessionRow {
  id: string;
  status: string;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}

interface EventRow {
  id: string;
  type: string;
  ip?: string | null;
  meta?: { integrationId?: string } | null;
  createdAt: string;
}

export default function SecurityPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    apiFetch<SessionRow[]>('/security/sessions').then(setSessions).catch(() => undefined);
    apiFetch<EventRow[]>('/security/events').then(setEvents).catch(() => undefined);
  }, []);

  async function revoke(id: string) {
    try {
      await apiFetch(`/security/sessions/${id}/revoke`, { method: 'POST', body: '{}' });
      setSessions((s) => s.filter((x) => x.id !== id));
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to revoke');
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(pw) });
      setPw({ currentPassword: '', newPassword: '' });
      setPasswordError(null);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Security</h1>
      <p className={styles.lede}>Sessions, password policy, and login history.</p>
      {passwordError && <p className={styles.error}>{passwordError}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Change password</h2>
        <form onSubmit={changePassword} className={styles.stack}>
          <input className={styles.input} type="password" placeholder="Current password" value={pw.currentPassword}
            onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
          <input className={styles.input} type="password" placeholder="New password" value={pw.newPassword}
            onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
          <button className={styles.btn} type="submit">Change password</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Active sessions</h2>
        {sessions.map((s) => (
          <div className={styles.row} key={s.id}>
            <div>
              <div className={styles.mono}>{s.id.slice(0, 8)}…</div>
              <div className={styles.mono}>{s.userAgent ?? 'unknown device'} · {s.ip ?? ''}</div>
            </div>
            <div>
              <span className={s.status === 'ACTIVE' ? styles.badgeOk : styles.badge}>{s.status}</span>{' '}
              {s.status === 'ACTIVE' && (
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => revoke(s.id)}>Revoke</button>
              )}
            </div>
          </div>
        ))}
        {sessions.length === 0 && <p>No sessions.</p>}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Security events / login history</h2>
        {events.map((e) => (
          <div className={styles.row} key={e.id}>
            <span className={styles.mono}>{new Date(e.createdAt).toLocaleString()}</span>
            <span>{e.type}{e.meta?.integrationId ? ' · ' + e.meta.integrationId.slice(0, 8) : ''}</span>
          </div>
        ))}
        {events.length === 0 && <div>No events yet.</div>}
      </div>
    </div>
  );
}
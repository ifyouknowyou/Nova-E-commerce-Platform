'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable } from '@/components/data/table';
import styles from '../platform.module.css';

interface SettingsState {
  org: Record<string, unknown>;
  me: Record<string, unknown>;
  orgTheme: string;
  orgLocale: string;
  meTheme: string;
  error: string | null;
}

/** Friendly labels for known settings keys. */
const KNOWN: Record<string, string> = {
  theme: 'Theme',
  locale: 'Locale',
  notifications: 'Notifications',
  brand: 'Brand',
};

export default function SettingsPage() {
  const [s, setS] = useState<SettingsState>({ org: {}, me: {}, orgTheme: '', orgLocale: '', meTheme: '', error: null });

  useEffect(() => {
    apiFetch<Record<string, unknown>>('/settings').then((org) =>
      setS((prev) => ({ ...prev, org, orgTheme: String(org.theme ?? ''), orgLocale: String(org.locale ?? '') })),
    ).catch(() => undefined);
    apiFetch<Record<string, unknown>>('/settings/me').then((me) =>
      setS((prev) => ({ ...prev, me, meTheme: String(me.theme ?? '') })),
    ).catch(() => undefined);
  }, []);

  async function patch(resource: string, kv: Record<string, unknown>, update: (v: Record<string, unknown>, raw: Record<string, unknown>) => void) {
    try {
      const raw = await apiFetch<Record<string, unknown>>(resource, { method: 'PATCH', body: JSON.stringify(kv) });
      update(raw, raw);
      setS((prev) => ({ ...prev, error: null }));
    } catch (err) {
      setS((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'Failed to save' }));
    }
  }

  const saveOrg = (kv: Record<string, unknown>) => patch('/settings', kv, (raw) => {
    setS((prev) => ({ ...prev, org: raw, orgTheme: String(raw.theme ?? prev.orgTheme), orgLocale: String(raw.locale ?? prev.orgLocale) }));
  });
  const saveMe = (kv: Record<string, unknown>) => patch('/settings/me', kv, (raw) => {
    setS((prev) => ({ ...prev, me: raw, meTheme: String(raw.theme ?? prev.meTheme) }));
  });

  const orgRows = Object.entries(s.org).map(([key, value]) => ({ key, label: KNOWN[key] ?? key, value }));
  const meRows = Object.entries(s.me).map(([key, value]) => ({ key, label: KNOWN[key] ?? key, value }));

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Settings</h1>
      <p className={styles.lede}>Organization + personal preferences, persisted to the database.</p>
      {s.error && <p className={styles.error} role="alert">{s.error}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Organization settings</h2>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <select className={styles.select} aria-label="Org theme" value={s.orgTheme} onChange={(e) => saveOrg({ theme: e.target.value })}>
            <option value="">Theme: system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <select className={styles.select} aria-label="Org locale" value={s.orgLocale} onChange={(e) => saveOrg({ locale: e.target.value })}>
            <option value="">Locale: default</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </form>
        <DataTable
          caption="Organization settings"
          columns={[
            { key: 'label', label: 'Setting', render: (r) => r.label },
            { key: 'value', label: 'Value', render: (r) => String(r.value) },
          ]}
          rows={orgRows as unknown as Record<string, unknown>[]}
          empty="No org settings stored."
        />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Personal preferences</h2>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <select className={styles.select} aria-label="Personal theme" value={s.meTheme} onChange={(e) => saveMe({ theme: e.target.value })}>
            <option value="">Theme: system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </form>
        <DataTable
          caption="Personal preferences"
          columns={[
            { key: 'label', label: 'Preference', render: (r) => r.label },
            { key: 'value', label: 'Value', render: (r) => String(r.value) },
          ]}
          rows={meRows as unknown as Record<string, unknown>[]}
          empty="No personal preferences stored."
        />
      </div>
    </div>
  );
}
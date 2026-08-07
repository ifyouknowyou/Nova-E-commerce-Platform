'use client';

import { ReactNode, useState } from 'react';
import styles from './auth.module.css';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {children}
      </section>
    </main>
  );
}

export function Field({ label, type, value, onChange, autoComplete }: {
  label: string;
  type: string;
  value: string;
  onChange: (_value: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function SubmitButton({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <button className={styles.submit} type="submit" disabled={busy}>
      {busy ? 'Please wait…' : children}
    </button>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className={styles.error}>{message}</p>;
}

export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

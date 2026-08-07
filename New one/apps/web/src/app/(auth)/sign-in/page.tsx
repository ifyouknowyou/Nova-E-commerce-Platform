'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell, ErrorBanner, Field, SubmitButton, useSubmit } from '@/components/auth/auth-page';
import styles from '@/components/auth/auth.module.css';
import { apiFetch } from '@/lib/api/client';
import { useSession } from '@/lib/api/session';

export default function SignInPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const { busy, error, run } = useSubmit();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => apiFetch('/auth/sign-in', { method: 'POST', body: JSON.stringify({ email, password }) }));
    if (ok) {
      await refresh();
      router.push('/dashboard');
    }
  }

  return (
    <AuthShell title="Sign in to NEXUS OS" subtitle="Welcome back.">
      <form onSubmit={onSubmit}>
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <ErrorBanner message={error} />
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
      <Link className={styles.link} href="/forgot-password">Forgot password?</Link>
      <p className={styles.note}>
        No account? <Link href="/sign-up">Create one</Link>
      </p>
    </AuthShell>
  );
}

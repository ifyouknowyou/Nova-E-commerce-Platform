'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthShell, ErrorBanner, Field, SubmitButton, useSubmit } from '@/components/auth/auth-page';
import styles from '@/components/auth/auth.module.css';
import { apiFetch } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const { busy, error, run } = useSubmit();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }));
    if (ok) setSent(true);
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link if an account exists.">
      {sent ? (
        <p>If an account exists for <strong>{email}</strong>, a reset link is on its way. Check the dev mail outbox.</p>
      ) : (
        <form onSubmit={onSubmit}>
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <ErrorBanner message={error} />
          <SubmitButton busy={busy}>Send reset link</SubmitButton>
        </form>
      )}
      <Link className={styles.link} href="/sign-in">Back to sign in</Link>
    </AuthShell>
  );
}

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthShell, ErrorBanner, Field, SubmitButton, useSubmit } from '@/components/auth/auth-page';
import styles from '@/components/auth/auth.module.css';
import { apiFetch } from '@/lib/api/client';

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const { busy, error, run } = useSubmit();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }));
    if (ok) setDone(true);
  }

  if (done) {
    return (
      <AuthShell title="Password updated">
        <p>Your password has been reset. <Link className={styles.link} href="/sign-in">Sign in</Link></p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit}>
        <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <ErrorBanner message={error} />
        <SubmitButton busy={busy}>Save new password</SubmitButton>
      </form>
      {!token && <p>Missing reset token.</p>}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

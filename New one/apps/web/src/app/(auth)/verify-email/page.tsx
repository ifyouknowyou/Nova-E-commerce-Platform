'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthShell } from '@/components/auth/auth-page';
import styles from '@/components/auth/auth.module.css';
import { apiFetch } from '@/lib/api/client';

function Verify() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!token) return setState('error');
    apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => setState('ok'))
      .catch(() => setState('error'));
  }, [token]);

  const body =
    state === 'loading' ? 'Verifying…' : state === 'ok' ? 'Email verified. You can now sign in / explore.' : 'That link is invalid or expired.';

  return (
    <AuthShell title="Email verification">
      <p>{body}</p>
      {state === 'ok' && (
        <Link className={styles.link} href="/sign-in">Continue</Link>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
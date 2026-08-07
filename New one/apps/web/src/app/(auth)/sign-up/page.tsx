'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell, ErrorBanner, Field, SubmitButton, useSubmit } from '@/components/auth/auth-page';
import styles from '@/components/auth/auth.module.css';
import { apiFetch } from '@/lib/api/client';
import { useSession } from '@/lib/api/session';

export default function SignUpPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const { busy, error, run } = useSubmit();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() =>
      apiFetch('/auth/sign-up', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, orgName: orgName || undefined }),
      }),
    );
    if (ok) {
      await refresh();
      router.push('/dashboard');
    }
  }

  return (
    <AuthShell title="Create your NEXUS OS account" subtitle="Your organization is created automatically.">
      <form onSubmit={onSubmit}>
        <Field label="Full name" type="text" value={name} onChange={setName} />
        <Field label="Work email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Organization (optional)" type="text" value={orgName} onChange={setOrgName} />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <ErrorBanner message={error} />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
      <p className={styles.note}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </AuthShell>
  );
}

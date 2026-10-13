'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  mode: AuthMode;
}

function errorMessage(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const { message } = payload;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join('. ');
    }
  }
  return 'Something went wrong. Please try again.';
}

function safeReturnPath(): string {
  const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
  if (!requestedPath) return '/';

  try {
    const destination = new URL(requestedPath, window.location.origin);
    return destination.origin === window.location.origin
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : '/';
  } catch {
    return '/';
  }
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isRegister = mode === 'register';

  async function sendRequest(path: string, body: object) {
    const response = await fetch(`/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(errorMessage(payload));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    try {
      if (verificationPending) {
        await sendRequest('verify-email', { code: verificationCode });
        setVerificationPending(false);
        setEmailVerified(true);
        return;
      }

      if (isRegister) {
        await sendRequest('register', { email, password, name: name.trim() || undefined });
        setVerificationPending(true);
        setNotice('Account created. Enter the 6-digit verification code sent to your email.');
        return;
      }

      await sendRequest('login', { email, password, rememberMe });
      window.location.assign(safeReturnPath());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reach the authentication service.');
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await sendRequest('resend-verification', { email });
      setNotice('A new verification code has been sent if the account is eligible.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resend the verification code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">NOVA account</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {emailVerified
            ? 'Email verified'
            : verificationPending
              ? 'Verify your email'
              : isRegister
                ? 'Create your account'
                : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {emailVerified
            ? 'Your account is ready. Sign in to continue.'
            : verificationPending
              ? `Enter the 6-digit code sent to ${email}.`
              : isRegister
                ? 'Create an account to get started.'
                : 'Sign in to your NOVA account.'}
        </p>
      </div>

      {emailVerified ? (
        <Button asChild className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      ) : (
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          {verificationPending ? (
            <div className="space-y-2">
              <label htmlFor="verification-code" className="text-sm font-medium">
                Verification code
              </label>
              <Input
                id="verification-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
              />
            </div>
          ) : (
            <>
              {isRegister && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
                    autoComplete="name"
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  minLength={isRegister ? 8 : undefined}
                  maxLength={128}
                  pattern={isRegister ? '(?=.*[A-Za-z])(?=.*[0-9]).{8,128}' : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {isRegister && (
                  <p className="text-xs text-muted-foreground">
                    Use 8–128 characters, including a letter and a number.
                  </p>
                )}
              </div>
            </>
          )}
          {!isRegister && !verificationPending && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Keep me signed in
            </label>
          )}
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              {notice}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy
              ? 'Please wait…'
              : verificationPending
                ? 'Verify email'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
          </Button>
          {verificationPending && (
            <Button
              type="button"
              variant="link"
              className="w-full"
              disabled={busy}
              onClick={() => void resendVerification()}
            >
              Resend verification code
            </Button>
          )}
        </form>
      )}

      {!verificationPending && !emailVerified && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? 'Already have an account?' : 'New to NOVA?'}{' '}
          <Link
            href={isRegister ? '/login' : '/register'}
            className="font-medium text-primary hover:underline"
          >
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      )}
      {verificationPending && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Wrong email?{' '}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              setVerificationPending(false);
              setNotice('');
              setVerificationCode('');
            }}
          >
            Go back
          </button>
        </p>
      )}
    </section>
  );
}

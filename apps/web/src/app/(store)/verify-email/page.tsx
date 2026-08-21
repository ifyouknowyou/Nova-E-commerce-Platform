'use client';

import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/auth';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="px-4 py-24 text-center text-muted-foreground">Loading…</p>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.verifyEmail(code);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function resend(): Promise<void> {
    if (!email.trim()) {
      toast.error('Enter your email to resend a code');
      return;
    }
    try {
      await authApi.resendVerification(email.trim());
      toast.success('A new code has been sent to your email');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend');
    }
  }

  if (done) {
    return (
      <AuthShell
        eyebrow="NOVA Commerce"
        title="Email verified"
        description="Your account is ready. You can now sign in."
        icon={<MailCheck className="h-5 w-5" />}
      >
        <Button asChild className="w-full rounded-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="NOVA Commerce"
      title="Verify your email"
      description="Enter the 6-digit code we sent you. It expires in 30 minutes."
      icon={<CheckCircle2 className="h-5 w-5" />}
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em]"
            aria-label="6-digit verification code"
          />
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Verify
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        <Label htmlFor="email">Email (for resending a code)</Label>
        <div className="flex gap-2">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Button variant="outline" onClick={() => void resend()}>
            Resend
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}

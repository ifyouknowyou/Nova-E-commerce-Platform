'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/auth';

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters').regex(/[a-zA-Z]/, 'Must contain a letter').regex(/\d/, 'Must contain a number'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="px-4 py-24 text-center text-muted-foreground">Loading…</p>}>
      <ResetContent />
    </Suspense>
  );
}

function ResetContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<{ password: string; confirm: string }>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-muted-foreground">Invalid or missing reset token.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(values: { password: string; confirm: string }): Promise<void> {
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, values.password);
      toast.success('Password updated. Sign in with your new password.');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="NOVA Commerce"
      title="Set a new password"
      description="Choose a strong password for your account"
      icon={<KeyRound className="h-5 w-5" />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="confirm" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full rounded-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Reset password
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
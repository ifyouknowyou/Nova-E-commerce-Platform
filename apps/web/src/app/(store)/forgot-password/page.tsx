'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/auth';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<{ email: string }>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  async function onSubmit(values: { email: string }): Promise<void> {
    setSubmitting(true);
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="NOVA Commerce"
        title="Check your email"
        description="If an account exists with that address, a password reset link is on its way."
        icon={<MailCheck className="h-5 w-5" />}
      >
        <Button asChild className="w-full rounded-full" variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="NOVA Commerce"
      title="Reset your password"
      description="Enter your email and we'll send you a reset link"
      icon={<KeyRound className="h-5 w-5" />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full rounded-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send reset link
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
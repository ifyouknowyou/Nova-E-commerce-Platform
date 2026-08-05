'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/auth';
import { safeRedirect } from '@/lib/utils';

const registerSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-zA-Z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a number'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="px-4 py-24 text-center text-muted-foreground">Loading…</p>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });

  async function onSubmit(values: RegisterValues): Promise<void> {
    setSubmitting(true);
    try {
      const { email } = await authApi.register({
        email: values.email,
        password: values.password,
        name: values.name || undefined,
      });
      setSent(email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="NOVA Commerce"
        title="Check your email"
        description={`We sent a 6-digit verification code to ${sent}. Enter it to activate your account.`}
        icon={<MailCheck className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Button asChild className="w-full rounded-full">
            <Link href={`/verify-email?email=${encodeURIComponent(sent)}`}>Enter verification code</Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              void authApi.resendVerification(sent).then(() => toast.success('Verification code resent'));
            }}
          >
            Resend code
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="NOVA Commerce"
      title="Create your account"
      description="Join NOVA Commerce to shop and sell"
      icon={<UserPlus className="h-5 w-5" />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name (optional)</FormLabel>
              <FormControl><Input autoComplete="name" {...field} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create account
          </Button>
        </form>
      </Form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={`/login${params.get('redirect') ? `?redirect=${encodeURIComponent(safeRedirect(params.get('redirect')))}` : ''}`}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, MailCheck, Store, UserPlus, UserRound } from 'lucide-react';
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
    accountType: z.enum(['CUSTOMER', 'SELLER']).default('CUSTOMER'),
    storeName: z.string().optional(),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-zA-Z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a number'),
    confirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirm'] });
    }
    const storeNameLen = data.storeName?.trim().length ?? 0;
    if (data.accountType === 'SELLER' && storeNameLen < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter your store name (at least 3 characters)',
        path: ['storeName'],
      });
    }
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

  const initialAccountType = params.get('type') === 'seller' ? 'SELLER' : 'CUSTOMER';
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '', accountType: initialAccountType, storeName: '' },
  });
  const showStoreName = form.watch('accountType') === 'SELLER';

  async function onSubmit(values: RegisterValues): Promise<void> {
    setSubmitting(true);
    try {
      const { email } = await authApi.register({
        email: values.email,
        password: values.password,
        name: values.name || undefined,
        accountType: values.accountType,
        storeName: values.accountType === 'SELLER' ? values.storeName?.trim() || undefined : undefined,
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
          <FormField control={form.control} name="accountType" render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Account type</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => field.onChange('CUSTOMER')}
                  aria-pressed={field.value === 'CUSTOMER'}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    field.value === 'CUSTOMER'
                      ? 'border-primary bg-role-soft'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    {field.value === 'CUSTOMER' ? <Check className="h-4 w-4 text-primary" /> : null}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">Customer</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    Shop products and buy from verified sellers
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange('SELLER')}
                  aria-pressed={field.value === 'SELLER'}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    field.value === 'SELLER'
                      ? 'border-primary bg-role-soft'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    {field.value === 'SELLER' ? <Check className="h-4 w-4 text-primary" /> : null}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">Seller</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    Open your own store and start selling
                  </span>
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )} />
          {showStoreName ? (
            <FormField control={form.control} name="storeName" render={({ field }) => (
              <FormItem>
                <FormLabel>Store name</FormLabel>
                <FormControl>
                  <Input autoComplete="organization" placeholder="e.g. Aurora Store" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          ) : null}
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
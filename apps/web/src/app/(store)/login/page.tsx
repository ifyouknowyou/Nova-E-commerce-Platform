'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/auth';
import { cartApi } from '@/lib/cart';
import { safeRedirect } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="px-4 py-24 text-center text-muted-foreground">Loading…</p>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  async function onSubmit(values: LoginValues): Promise<void> {
    setSubmitting(true);
    try {
      const user = await authApi.login(values.email, values.password, values.rememberMe);
      if (!user.emailVerified) {
        toast.info('Please verify your email before continuing');
      }
      await cartApi.merge().catch(() => undefined);
      toast.success(`Welcome${user.name ? `, ${user.name}` : ''}!`);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="NOVA Commerce"
      title="Welcome back"
      description="Sign in to your account to continue shopping"
      icon={<LogIn className="h-5 w-5" />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="you@example.com" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="rememberMe" render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Remember me"
                />
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Remember me
                </button>
              </div>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </FormItem>
          )} />
          <Button type="submit" className="w-full rounded-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>
      </Form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        New to NOVA?{' '}
        <Link href={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
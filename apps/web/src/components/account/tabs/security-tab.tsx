'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { BadgeCheck, Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/lib/auth';
import { usersApi } from '@/lib/profile';
import { formatDate } from '@/lib/utils';
import { ErrorState, SectionCard } from '../ui';

export function SecurityTab({ email }: { email: string }) {
  const { data: security, isLoading, isError, refetch } = useQuery({
    queryKey: ['security'],
    queryFn: usersApi.security,
  });

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const changePassword = useMutation({
    mutationFn: async () => {
      await authApi.changePassword(current, next);
      await authApi.logout();
    },
    onSuccess: () => {
      toast.success('Password changed. Please sign in again.');
      window.location.assign('/login?redirect=/account/profile');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not change password'),
  });

  const resend = useMutation({
    mutationFn: () => authApi.resendVerification(email),
    onSuccess: () => toast.success('Verification email sent.'),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not resend email'),
  });

  const logoutAll = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => {
      toast.success('Signed out everywhere.');
      window.location.assign('/login?redirect=/account/profile');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not sign out'),
  });

  const passwordValid =
    next.length >= 8 && /[a-zA-Z]/.test(next) && /\d/.test(next) && next === confirm && current.length > 0;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Password"
        description="Use at least 8 characters with a letter and a number. Changing your password signs you out everywhere."
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="security-current">Current password</Label>
            <Input
              id="security-current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="security-new">New password</Label>
              <Input
                id="security-new"
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-confirm">Confirm new password</Label>
              <Input
                id="security-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          {next && confirm && next !== confirm ? (
            <p className="text-xs text-red-600">Passwords do not match.</p>
          ) : null}
          <div className="flex justify-end">
            <Button
              onClick={() => void changePassword.mutate()}
              disabled={!passwordValid || changePassword.isPending}
            >
              {changePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Update password
            </Button>
          </div>
        </div>
      </SectionCard>

      {isError ? (
        <ErrorState
          title="Could not load security details"
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : security ? (
        <>
          <SectionCard
            title="Verification"
            description="Confirm the email address on your account."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {security.emailVerified ? (
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {security.emailVerified ? 'Email verified' : 'Email not verified'}
                  </p>
                  {!security.emailVerified ? (
                    <p className="text-xs text-muted-foreground">Verify your email to unlock all features.</p>
                  ) : null}
                </div>
              </div>
              {!security.emailVerified ? (
                <Button size="sm" variant="outline" onClick={() => void resend.mutate()} disabled={resend.isPending}>
                  {resend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Resend verification
                </Button>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Sessions"
            description={
              security.lastLoginAt
                ? `Last sign-in: ${formatDate(security.lastLoginAt, { hour: 'numeric', minute: '2-digit' })}`
                : 'No recorded sign-in yet.'
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Sign out of every device and browser at once.
              </p>
              <Button size="sm" variant="outline" onClick={() => void logoutAll.mutate()} disabled={logoutAll.isPending}>
                {logoutAll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Sign out everywhere
              </Button>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

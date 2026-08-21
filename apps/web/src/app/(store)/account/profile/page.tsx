'use client';

import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/account/ui';
import { ProfileHeader } from '@/components/account/profile-header';
import { ProfileScene } from '@/components/account/profile-scene';
import { ProfileTabs, ProfileTabsSkeleton } from '@/components/account/profile-tabs';
import { useAuthenticated } from '@/hooks/use-auth';
import { usersApi } from '@/lib/profile';
import { sellerApi } from '@/lib/seller';
import Link from 'next/link';

export default function ProfilePage() {
  const { authed, ready } = useAuthenticated();
  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.me,
    enabled: ready && authed,
  });

  // Store status badge in the header (seller only).
  const { data: store } = useQuery({
    queryKey: ['my-store'],
    queryFn: sellerApi.getMyStore,
    enabled: ready && authed && (profile?.roles.includes('SELLER') ?? false),
  });

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to view your profile</h1>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/account/profile">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load your profile"
        description="Check your connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <ProfileTabsSkeleton />
      </div>
    );
  }

  return (
    <ProfileScene>
      <ProfileHeader profile={profile} storeStatus={store?.status ?? null} />
      <Suspense fallback={<ProfileTabsSkeleton />}>
        <ProfileTabs profile={profile} />
      </Suspense>
    </ProfileScene>
  );
}

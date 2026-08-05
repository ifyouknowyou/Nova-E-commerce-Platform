'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, CircleAlert, CircleDashed, Store as StoreIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { sellerApi } from '@/lib/seller';
import type { UserProfile } from '@/lib/profile';
import { cn } from '@/lib/utils';
import { SectionCard } from '../ui';

function CheckRow({
  done,
  icon: Icon,
  title,
  description,
}: {
  done: boolean;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {!done ? (
          <Badge variant="outline" className="mt-2 text-xs capitalize">
            {title === 'Email verified' ? 'Action required' : 'In progress'}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

export function VerificationTab({ profile }: { profile: UserProfile }) {
  const { data: store, isLoading } = useQuery({ queryKey: ['my-store'], queryFn: sellerApi.getMyStore });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const storeActive = store?.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <SectionCard
        title="Verification status"
        description="The steps required to sell on NOVA and the current state of each."
      >
        <div className="space-y-3">
          <CheckRow
            done={profile.emailVerified}
            icon={BadgeCheck}
            title="Email verified"
            description="Confirm the email address on your account to keep it secure."
          />
          <CheckRow
            done={!!store}
            icon={StoreIcon}
            title="Store created"
            description="Create a store to list products on the marketplace."
          />
          <CheckRow
            done={storeActive}
            icon={CircleDashed}
            title="Store approved"
            description="A platform administrator reviews and activates your store."
          />
        </div>
      </SectionCard>

      {store && !storeActive ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Your store is {store.status.toLowerCase()}</p>
            <p className="mt-1">
              Store approval is required before your products go live. This is handled by platform
              administrators.
            </p>
          </div>
        </div>
      ) : null}

      {storeActive ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-300/50 bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Your store is live</p>
            <p className="mt-1">You can now list products and accept orders.</p>
          </div>
        </div>
      ) : null}

      {!profile.emailVerified ? (
        <Button asChild variant="outline" size="sm">
          <Link href="/account/profile?tab=security">Verify your email</Link>
        </Button>
      ) : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAccessToken } from '@/lib/api';

/**
 * Auth-aware "sell" call-to-action. Shows onboarding links for guests and a
 * direct link to the seller dashboard for signed-in users.
 */
export function SellCta() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const authed = mounted && !!getAccessToken();

  if (authed) {
    return (
      <Button asChild size="lg">
        <Link href="/dashboard">Go to your dashboard</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="lg">
        <Link href="/register?type=seller">Create your store</Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href="/login?redirect=/dashboard">Sign in to sell</Link>
      </Button>
    </>
  );
}

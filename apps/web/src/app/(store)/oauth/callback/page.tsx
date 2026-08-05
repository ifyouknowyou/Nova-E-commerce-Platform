'use client';

import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { authApi } from '@/lib/auth';
import { cartApi } from '@/lib/cart';

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<p className="px-4 py-24 text-center text-muted-foreground">Loading…</p>}>
      <OAuthContent />
    </Suspense>
  );
}

function OAuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const exchanging = useRef(false);

  useEffect(() => {
    if (exchanging.current) return;
    const code = params.get('code');
    if (!code) {
      router.replace('/login?error=missing_code');
      return;
    }
    exchanging.current = true;
    authApi
      .exchangeOAuth(code)
      .then(async (user) => {
        await cartApi.merge().catch(() => undefined);
        toast.success(`Welcome${user.name ? `, ${user.name}` : ''}!`);
        router.replace('/');
        router.refresh();
      })
      .catch(() => router.replace('/login?error=oauth_failed'));
  }, [params, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
'use client';

import { Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCart } from '@/hooks/use-cart';
import { useAuthenticated } from '@/hooks/use-auth';
import { useWishlist } from '@/lib/wishlist';
import { PageHeader } from '@/components/3d/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

export default function WishlistPage() {
  const { authed, ready } = useAuthenticated();
  const { items, isLoading, remove } = useWishlist();
  const { addItem } = useCart();

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Sign in to view your wishlist</h1>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/wishlist">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Wishlist" subtitle="Items you've saved for later" />

      {isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border py-16 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Your wishlist is empty.</p>
          <Button asChild className="mt-4">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-20 w-20 rounded-md border object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-sm font-semibold">{formatCurrency(item.effectivePrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void addItem({ productId: item.productId }).then(() => toast.success('Added to cart'))}
                  >
                    Add to cart
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${item.name}`} onClick={() => void remove(item.productId)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
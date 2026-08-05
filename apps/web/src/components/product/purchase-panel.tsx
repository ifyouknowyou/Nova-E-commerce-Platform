'use client';

import { Heart, Loader2, Minus, Plus, ShoppingCart, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthenticated } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/lib/wishlist';
import { cn } from '@/lib/utils';
import type { PublicProduct } from '@/lib/api/types';

export function PurchasePanel({ product }: { product: PublicProduct }) {
  const { addItem, addingItem } = useCart();
  const router = useRouter();
  const { authed, ready } = useAuthenticated();
  const wishlist = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const outOfStock = product.stock <= 0;

  const isWishlisted = wishlist.isWishlisted(product.id);

  async function handleAdd(): Promise<void> {
    try {
      await addItem({ productId: product.id, quantity });
      toast.success(`Added ${quantity} to cart`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add to cart');
    }
  }

  async function handleBuyNow(): Promise<void> {
    setBuying(true);
    try {
      await addItem({ productId: product.id, quantity });
      router.push('/checkout');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setBuying(false);
    }
  }

  async function toggleWishlist(): Promise<void> {
    if (!authed) {
      toast.info('Sign in to save items to your wishlist');
      return;
    }
    try {
      if (isWishlisted) await wishlist.remove(product.id);
      else await wishlist.add(product.id);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update wishlist');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {outOfStock ? (
          <Badge variant="destructive">Out of stock</Badge>
        ) : (
          <Badge variant="success">In stock · {product.stock} available</Badge>
        )}
        <Badge variant="outline" className="text-xs">
          Ships within 24h
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-md border" aria-label="Quantity selector">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-sm font-medium" aria-live="polite">
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            disabled={quantity >= product.stock}
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button size="lg" className="min-w-44 flex-1" disabled={outOfStock || addingItem} onClick={() => void handleAdd()}>
          {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </Button>

        <Button
          size="lg"
          variant="secondary"
          className="min-w-40 flex-1"
          disabled={outOfStock || buying}
          onClick={() => void handleBuyNow()}
        >
          {buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Buy now
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => void toggleWishlist()}
        disabled={!ready}
      >
        <Heart className={cn('h-4 w-4', isWishlisted && 'fill-red-500 text-red-500')} />
        {isWishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
      </Button>

      <p className="text-xs text-muted-foreground">
        Estimated delivery in 3–7 business days. Free shipping on orders over $50.
      </p>
    </div>
  );
}
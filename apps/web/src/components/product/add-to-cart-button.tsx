'use client';

import { Loader2, ShoppingCart } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  productId: string;
  stock: number;
  className?: string;
  children?: ReactNode;
}

export function AddToCartButton({ productId, stock, className, children }: AddToCartButtonProps) {
  const { addItem, addingItem } = useCart();
  const outOfStock = stock <= 0;

  const handleClick = async (): Promise<void> => {
    if (outOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    try {
      await addItem({ productId });
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add to cart');
    }
  };

  return (
    <Button className={cn(className)} disabled={outOfStock || addingItem} onClick={() => void handleClick()}>
      {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
      {outOfStock ? 'Out of stock' : (children ?? 'Add to cart')}
    </Button>
  );
}

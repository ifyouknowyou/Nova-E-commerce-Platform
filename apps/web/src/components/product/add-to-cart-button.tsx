'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Loader2, ShoppingCart } from 'lucide-react';
import { useState, type ReactNode } from 'react';
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

/**
 * AddToCartButton — a cart action with tactile feedback: a count-up "+1"
 * that floats off the button and a brief success pop, so "adding to cart"
 * reads as a physical event rather than a silent state change.
 */
export function AddToCartButton({ productId, stock, className, children }: AddToCartButtonProps) {
  const { addItem, addingItem } = useCart();
  const reduce = useReducedMotion();
  const [justAdded, setJustAdded] = useState(false);
  const [flyKey, setFlyKey] = useState(0);
  const outOfStock = stock <= 0;

  const handleClick = async (): Promise<void> => {
    if (outOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    try {
      await addItem({ productId });
      setJustAdded(true);
      setFlyKey((k) => k + 1);
      toast.success('Added to cart');
      window.setTimeout(() => setJustAdded(false), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add to cart');
    }
  };

  return (
    <span className={cn('relative inline-block', className)}>
      <Button className={cn('w-full', className)} disabled={outOfStock || addingItem} onClick={() => void handleClick()}>
        {justAdded ? (
          <Check className="h-4 w-4" />
        ) : addingItem ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {outOfStock ? 'Out of stock' : children ?? (justAdded ? 'Added' : 'Add to cart')}
      </Button>

      <AnimatePresence>
        {justAdded && !reduce ? (
          <motion.span
            key={flyKey}
            className="pointer-events-none absolute left-1/2 top-0 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
            initial={{ y: 0, x: '-50%', opacity: 0, scale: 0.5 }}
            animate={{ y: -64, opacity: 0, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] font-bold">+1</span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
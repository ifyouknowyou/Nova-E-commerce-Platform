'use client';

import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';

/**
 * AnimatedCartButton — cart icon with pulse badge and magnetic hover.
 */
export function AnimatedCartButton() {
  const { itemCount } = useCart();
  const hasItems = itemCount > 0;

  return (
    <Link href="/cart" className="relative">
      <motion.div
        className="relative flex items-center justify-center rounded-full p-2"
        whileHover={{ scale: 1.1, rotateY: 12 }}
        whileTap={{ scale: 0.9 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <ShoppingCart className="h-5 w-5 text-foreground/70" />
        {hasItems && (
          <>
            {/* Pulse ring */}
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {/* Badge */}
            <motion.span
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </motion.span>
          </>
        )}
      </motion.div>
    </Link>
  );
}

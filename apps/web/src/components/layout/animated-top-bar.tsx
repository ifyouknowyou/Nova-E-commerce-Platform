'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

/**
 * AnimatedTopBar — subtle gradient pulse with promotional text.
 * Appears above the main navbar with a living, breathing feel.
 */
export function AnimatedTopBar() {
  return (
    <motion.div
      className="relative overflow-hidden border-b border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Animated gradient sweep */}
      <motion.div
        className="absolute inset-0 opacity-40"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--primary) 30%, transparent) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-1.5 text-center">
        <p className="text-xs font-medium text-foreground/80">
          <Sparkles className="mr-1.5 inline h-3 w-3 text-primary" />
          Free shipping on orders over $50 · New arrivals every week ·
          <Link href="/deals" className="ml-1 text-primary hover:underline">
            Shop deals →
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

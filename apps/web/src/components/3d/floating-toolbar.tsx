'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FloatingToolbarProps {
  className?: string;
  children: ReactNode;
}

/**
 * FloatingToolbar — a frosted, depth-elevated action bar that springs in.
 * Drop it anywhere (typically over a dashboard or gallery) for a floating
 * set of tools. Reduced-motion users get it without the entrance animation.
 */
export function FloatingToolbar({ className, children }: FloatingToolbarProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cn(
        'pointer-events-auto inline-flex items-center gap-1 rounded-2xl border bg-card/85 p-1.5 text-card-foreground depth-3 backdrop-blur-md',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

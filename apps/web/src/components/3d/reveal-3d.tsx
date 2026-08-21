'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Reveal3DProps {
  /** Stagger delay in seconds for sequential section/tile entrances. */
  delay?: number;
  /** Tilt (degrees) the content springs from. */
  tilt?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Reveal3D — scrolls a block into view with a subtle 3D rotation + lift.
 * Wraps whole sections or individual tiles so the page reads as layered depth
 * rather than flat content. One-shot (plays once) and reduced-motion safe.
 */
export function Reveal3D({ delay = 0, tilt = 8, className, children }: Reveal3DProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, rotateX: -tilt, transformPerspective: 900 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 200, damping: 26, delay }}
      style={{ transformOrigin: 'center top' }}
    >
      {children}
    </motion.div>
  );
}

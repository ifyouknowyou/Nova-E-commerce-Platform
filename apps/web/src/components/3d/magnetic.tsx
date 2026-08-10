'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import type { PointerEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface MagneticProps {
  /** How strongly the element is drawn toward the pointer (0–1). */
  strength?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Magnetic — wraps children (typically a button) and gently pulls them
 * toward the pointer, springing back on leave. Purely decorative; the
 * child keeps all of its own click/keyboard behavior.
 */
export function Magnetic({ strength = 0.3, className, children }: MagneticProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      className={cn('inline-block', className)}
      style={reduce ? undefined : { x: sx, y: sy }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}

'use client';

import { useReducedMotion } from 'framer-motion';
import { useRef, type HTMLAttributes, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

const DEPTH = { 1: 'depth-1', 2: 'depth-2', 3: 'depth-3', 4: 'depth-4' } as const;

export interface SpatialPanelProps extends HTMLAttributes<HTMLDivElement> {
  depth?: 1 | 2 | 3 | 4;
  /** Add a pointer-tracking primary-light spotlight. */
  spotlight?: boolean;
  /** Use the frosted-glass surface instead of a solid card. */
  glass?: boolean;
}

/**
 * SpatialPanel — a depth-elevated surface with optional pointer spotlight
 * and glass treatment. The workhorse container for spatial compositions.
 */
export function SpatialPanel({
  depth = 2,
  spotlight,
  glass,
  className,
  onPointerMove,
  ...props
}: SpatialPanelProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    }
    onPointerMove?.(e);
  }

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border bg-card text-card-foreground',
        DEPTH[depth],
        glass && 'glass-strong',
        spotlight && 'spotlight',
        className,
      )}
      onPointerMove={spotlight && !reduce ? handleMove : onPointerMove}
      {...props}
    />
  );
}

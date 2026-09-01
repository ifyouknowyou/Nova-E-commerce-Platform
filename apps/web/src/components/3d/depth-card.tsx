'use client';

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const DEPTH_LEVELS = { 1: 'depth-1', 2: 'depth-2', 3: 'depth-3' } as const;

/**
 * Layered-depth card. Elevates content with multi-plane shadows that feel
 * dimensional without any animation cost.
 */
export function DepthCard({
  className,
  level = 2,
  glow = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { level?: 1 | 2 | 3; glow?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground',
        glow && 'glow-ring',
        DEPTH_LEVELS[level],
        className,
      )}
      {...props}
    />
  );
}

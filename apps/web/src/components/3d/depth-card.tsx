import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

const DEPTH_LEVELS = { 1: 'depth-1', 2: 'depth-2', 3: 'depth-3' } as const;

/**
 * Layered-depth card. Elevates content with multi-plane shadows that feel
 * dimensional without any animation cost.
 */
export function DepthCard({
  className,
  level = 2,
  ...props
}: HTMLAttributes<HTMLDivElement> & { level?: 1 | 2 | 3 }) {
  return <div className={cn('rounded-xl border bg-card text-card-foreground', DEPTH_LEVELS[level], className)} {...props} />;
}

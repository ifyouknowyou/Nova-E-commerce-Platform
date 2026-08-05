import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

/**
 * Frosted-glass surface. Use over colorful backgrounds/imagery where the blur
 * reads as depth rather than flat white.
 */
export function GlassCard({
  className,
  strong = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div
      className={cn('rounded-xl text-card-foreground', strong ? 'glass-strong' : 'glass', className)}
      {...props}
    />
  );
}

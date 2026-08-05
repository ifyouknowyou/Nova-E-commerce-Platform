import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

/**
 * Floating card — an elevated, softly-glowing panel that gently bobs. Use
 * sparingly for hero / KPI emphasis. The float animation is a pure transform
 * and is disabled globally by the reduced-motion media query in globals.css.
 */
export function FloatingCard({
  className,
  slow = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { slow?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground depth-2',
        slow ? 'animate-float-slow' : 'animate-float',
        className,
      )}
      {...props}
    />
  );
}

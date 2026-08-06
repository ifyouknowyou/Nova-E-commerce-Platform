'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface LayeredCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional decorative layer revealed behind content on hover. */
  layer?: ReactNode;
}

/**
 * LayeredCard — a depth-elevated card whose content sits above an optional
 * accent layer that fades in behind it on hover, giving a two-plane feel.
 */
export function LayeredCard({ layer, className, children, ...props }: LayeredCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-card text-card-foreground depth-2',
        'transition-transform duration-300 hover:-translate-y-1',
        className,
      )}
      {...props}
    >
      {layer ? (
        <div aria-hidden className="absolute -inset-px rounded-2xl bg-primary/6 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

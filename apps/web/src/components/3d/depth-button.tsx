'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/20',
  outline: 'border bg-card text-card-foreground hover:bg-accent',
  ghost: 'border-transparent text-foreground hover:bg-accent',
} as const;

export interface DepthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
}

/**
 * DepthButton — a pill button with a layered shadow that presses down on
 * click, reading as a physical key rather than a flat rectangle.
 */
export function DepthButton({ variant = 'primary', className, ...props }: DepthButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium',
        'shadow-[0_6px_20px_-6px_var(--shadow-color)] transition-all duration-200',
        'hover:-translate-y-px hover:shadow-[0_10px_26px_-8px_var(--shadow-color)]',
        'active:translate-y-0.5 active:shadow-none disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

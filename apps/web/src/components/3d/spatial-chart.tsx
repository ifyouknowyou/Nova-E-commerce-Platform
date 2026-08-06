'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SpatialChartProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

/**
 * SpatialChart — a depth-elevated chart shell with a floating title row.
 * A lighter alternative to ChartContainer when you just need a framed chart.
 */
export function SpatialChart({ title, subtitle, className, children }: SpatialChartProps) {
  return (
    <div className={cn('rounded-2xl border bg-card text-card-foreground depth-2', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-4">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="p-5 pt-4">{children}</div>
    </div>
  );
}

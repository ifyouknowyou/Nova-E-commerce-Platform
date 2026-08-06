'use client';

import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './animated-counter';
import { SpatialPanel } from './spatial-panel';

const TONE = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
} as const;

export interface KPI3DCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  tone?: keyof typeof TONE;
  /** Percent change vs previous period; hides the row when omitted. */
  trend?: number;
  sub?: string;
  className?: string;
}

/**
 * KPI3DCard — a depth-elevated KPI panel with a floating icon chip,
 * count-up value, and trend indicator. Used across the seller and admin
 * workspaces so metrics read as dimensional panels, not flat tiles.
 */
export function KPI3DCard({
  label,
  value,
  prefix,
  suffix,
  decimals,
  icon: Icon,
  tone = 'primary',
  trend,
  sub,
  className,
}: KPI3DCardProps) {
  const up = typeof trend === 'number' && trend >= 0;
  const Trend = up ? TrendingUp : TrendingDown;

  return (
    <SpatialPanel depth={3} spotlight className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
          {sub ? <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', TONE[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {typeof trend === 'number' ? (
        <div
          className={cn(
            'mt-4 flex items-center gap-1.5 text-xs font-semibold',
            up ? 'text-success' : 'text-warning',
          )}
        >
          <Trend className="h-3.5 w-3.5" />
          <span>
            {up ? '+' : ''}
            {trend}%
          </span>
          <span className="font-normal text-muted-foreground">vs prev. period</span>
        </div>
      ) : null}
    </SpatialPanel>
  );
}

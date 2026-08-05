'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedKPIProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  sub?: string;
  tone?: 'default' | 'positive' | 'warning' | 'danger';
  className?: string;
}

const TONES: Record<string, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

/**
 * Floating KPI panel with a pop-in number. Icon sits in a soft accent chip so
 * dense dashboards stay scannable. Motion respects prefers-reduced-motion.
 */
export function AnimatedKPI({ label, value, icon: Icon, sub, tone = 'default', className }: AnimatedKPIProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={cn('rounded-xl border bg-card p-5 text-card-foreground depth-1', className)}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn('mt-3 text-2xl font-bold tracking-tight', TONES[tone])}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </motion.div>
  );
}

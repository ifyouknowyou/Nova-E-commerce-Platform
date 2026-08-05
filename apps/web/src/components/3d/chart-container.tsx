import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Wraps an SVG/CSS chart in a depth panel with an optional legend row. Keeps
 * the visual language of data panels consistent across seller + admin.
 */
export function ChartContainer({
  title,
  subtitle,
  legend,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 text-card-foreground depth-1', className)}>
      {(title || legend) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {legend ? <div className="flex items-center gap-3 text-xs text-muted-foreground">{legend}</div> : null}
        </div>
      )}
      <div className={title || legend ? 'mt-4' : ''}>{children}</div>
    </div>
  );
}

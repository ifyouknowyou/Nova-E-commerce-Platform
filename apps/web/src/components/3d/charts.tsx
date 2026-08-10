'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Bar {
  label: string;
  value: number;
}

/**
 * Hand-rolled 3D-style bar chart (pure SVG/CSS, GPU-friendly). Bars render as
 * a front face + a darker top edge to read as extruded 3D columns. Values are
 * labeled accessibly; tooltips via native title. Reduced motion renders static.
 */
export function BarChart3D({
  data,
  height = 180,
  formatValue = (v) => String(v),
  className,
}: {
  data: Bar[];
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const max = Math.max(1, ...data.map((d) => d.value));
  const top = 10;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - top);
          return (
            <div
              key={`${d.label}-${i}`}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: '100%' }}
            >
              <span className="mb-1 hidden text-[10px] font-medium text-muted-foreground group-hover:block">
                {formatValue(d.value)}
              </span>
              <div
                className="w-full rounded-t-sm bg-primary/80 transition-all duration-500 ease-out"
                style={{
                  height: mounted && !reduce ? h : 0,
                  // Extruded top edge via inset shadow
                  boxShadow: `inset 0 ${Math.max(2, h * 0.12)}px 0 color-mix(in oklch, var(--primary) 45%, transparent), inset 0 0 0 1px color-mix(in oklch, var(--primary) 30%, transparent)`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="flex-1 truncate text-center text-[10px] text-muted-foreground">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Segment {
  label: string;
  value: number;
  color: string;
}

/** Horizontal segmented bar for category/status distributions. */
export function DistributionBar({
  segments,
  total,
  className,
}: {
  segments: Segment[];
  total?: number;
  className?: string;
}) {
  const sum = total ?? (segments.reduce((acc, s) => acc + s.value, 0) || 1);
  return (
    <div className={className}>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Distribution">
        {segments.map((s) => {
          const width = (s.value / sum) * 100;
          if (width <= 0) return null;
          return <div key={s.label} style={{ width: `${width}%`, backgroundColor: s.color }} title={`${s.label}: ${s.value}`} />;
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.label}
            <span className="font-medium text-foreground">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** SVG donut ring for completion/ratio metrics. */
export function DonutRing({
  value,
  total,
  size = 120,
  strokeWidth = 10,
  label,
  color = 'var(--primary)',
}: {
  value: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}) {
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={label ?? `${Math.round(pct * 100)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <span className="absolute text-lg font-bold">{Math.round(pct * 100)}%</span>
    </div>
  );
}

/** Row with a progress bar — used for ranked lists (top products/customers). */
export function ProgressRow({
  label,
  value,
  max,
  display,
}: {
  label: string;
  value: number;
  max: number;
  display?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className="flex-1">
        <div className="ml-auto h-1.5 max-w-[160px] overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </span>
      <span className="shrink-0 font-medium">{display ?? value}</span>
    </div>
  );
}

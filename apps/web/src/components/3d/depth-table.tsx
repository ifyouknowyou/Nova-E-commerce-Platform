'use client';

import type { ReactNode, TableHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface DepthTableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Column headers, rendered sticky in a frosted row. */
  head?: string[];
  children: ReactNode;
}

/**
 * DepthTable — a depth-elevated table with a sticky frosted header row and a
 * scrollable body. Use for dense data (orders, inventory, audit logs) where a
 * flat Card grid would eat vertical space.
 */
export function DepthTable({ head, className, children, ...props }: DepthTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground depth-2">
      <div className="max-h-[420px] overflow-auto scroll-thin">
        <table className={cn('w-full text-sm', className)} {...props}>
          {head ? (
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
              <tr>
                {head.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

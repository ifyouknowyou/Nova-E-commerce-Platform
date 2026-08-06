'use client';

import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CommandPanelProps {
  title?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/**
 * CommandPanel — a command-palette-style surface: frosted, deeply elevated,
 * with a search-style header row and a footer hint. Use for quick actions,
 * admin consoles, or global navigation surfaces.
 */
export function CommandPanel({ title, hint, className, children }: CommandPanelProps) {
  return (
    <div className={cn('rounded-2xl border bg-card/90 text-card-foreground depth-4 backdrop-blur-md', className)}>
      {title ? (
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
      ) : null}
      <div className="p-2">{children}</div>
      {hint ? (
        <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

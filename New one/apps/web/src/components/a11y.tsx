'use client';

import { ReactNode } from 'react';

/** Screen-reader-only content (pair with the `.nexus-sr-only` class). */
export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="nexus-sr-only">{children}</span>;
}

/** Live region for announcing async results (e.g. auth errors). */
export function Announce({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <span id={id} role="status" aria-live="polite" className="nexus-sr-only">
      {children}
    </span>
  );
}
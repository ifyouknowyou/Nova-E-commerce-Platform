'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

/** Composes the theme and local query providers used by the catalog. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}

'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { RoleThemeProvider } from './role-theme-provider';
import { ThemeProvider } from './theme-provider';

/** Composes all app-wide providers (theme, data fetching, role theming, toasts). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <RoleThemeProvider>{children}</RoleThemeProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

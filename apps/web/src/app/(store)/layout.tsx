import type { ReactNode } from 'react';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

/** Storefront shell: header + main + footer for all public store routes. */
export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AmbientBackground />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

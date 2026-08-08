'use client';

import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { RequireRole } from '@/components/require-role';
import { Sidebar } from '@/components/shell/sidebar';
import { SELLER_NAV_GROUPS } from '@/lib/nav';

/**
 * Seller dashboard shell. Gated to SELLER or ADMIN at both the UI layer
 * (RequireRole) and the API layer (@Roles('SELLER', 'ADMIN')).
 */
export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole
      roles={['SELLER']}
      excludeRoles={['ADMIN']}
      deniedTitle="Seller dashboard"
      deniedMessage="Only sellers can access this section. Administrators moderate the marketplace — they do not sell."
    >
      <div className="relative flex min-h-screen flex-col bg-role-soft/40">
        <div aria-hidden className="workspace-backdrop seller-atmosphere" />
        <SiteHeader />
        <div className="page-container flex flex-1 gap-6 lg:gap-[clamp(1.25rem,2vw,3rem)]">
          <Sidebar groups={SELLER_NAV_GROUPS} accent="default" />
          <main id="main" className="min-w-0 flex-1 py-8">
            {children}
          </main>
        </div>
        <SiteFooter />
      </div>
    </RequireRole>
  );
}

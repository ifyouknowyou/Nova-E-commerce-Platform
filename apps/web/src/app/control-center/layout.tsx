'use client';

import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Sidebar } from '@/components/shell/sidebar';
import { CONTROL_CENTER_NAV_GROUPS } from '@/lib/nav';
import { OrgSwitcher } from '@/components/shell/org-switcher';

/**
 * Control Center shell (multi-tenant Commerce Command Center). Coexists with
 * the existing seller `/dashboard` — it does not replace it. The org switcher
 * sets the `x-organization-id` header used by every Control Center API call.
 */
export default function ControlCenterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div aria-hidden className="workspace-backdrop command-atmosphere" />
      <SiteHeader />
      <div className="page-container flex flex-1 gap-6 lg:gap-[clamp(1.25rem,2vw,3rem)]">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col gap-4 py-6">
            <OrgSwitcher />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Sidebar groups={CONTROL_CENTER_NAV_GROUPS} accent="command" />
            </div>
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1 py-8">
          {children}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}

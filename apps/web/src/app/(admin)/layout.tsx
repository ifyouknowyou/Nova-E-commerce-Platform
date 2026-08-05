'use client';

import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { RequireRole } from '@/components/require-role';
import { AdminNav } from './admin-nav';

/**
 * Admin section shell. Access is gated to ADMIN role at both the UI layer
 * (RequireRole) and the API layer (@Roles('ADMIN')).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole
      roles={['ADMIN']}
      deniedTitle="Access denied"
      deniedMessage="You need an Administrator role to view this section."
    >
      <div className="flex min-h-screen flex-col bg-role-soft/30">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-[1500px] flex-1 px-4 sm:px-6 lg:px-8">
          <aside className="hidden shrink-0 lg:block">
            <AdminNav />
          </aside>
          <main id="main" className="min-w-0 flex-1 py-8 lg:pl-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
        <SiteFooter />
      </div>
    </RequireRole>
  );
}
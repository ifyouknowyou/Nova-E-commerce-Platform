'use client';

import { BarChart3, Boxes, LayoutDashboard, Package, ShoppingBag, Store, Ticket } from 'lucide-react';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Sidebar, type SidebarGroup } from '@/components/shell/sidebar';
import { RequireRole } from '@/components/require-role';

const GROUPS: SidebarGroup[] = [
  {
    title: 'Business',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/dashboard/products', icon: Package },
      { label: 'Inventory', href: '/dashboard/inventory', icon: Boxes },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
      { label: 'Coupons', href: '/dashboard/coupons', icon: Ticket },
    ],
  },
  {
    title: 'Store',
    items: [{ label: 'Store settings', href: '/dashboard/store', icon: Store }],
  },
];

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
      <div className="flex min-h-screen flex-col bg-role-soft/40">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-[1500px] flex-1 gap-0 px-4 sm:px-6 lg:px-8">
          <Sidebar groups={GROUPS} accent="default" />
          <main id="main" className="min-w-0 flex-1 py-8 lg:pl-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
        <SiteFooter />
      </div>
    </RequireRole>
  );
}

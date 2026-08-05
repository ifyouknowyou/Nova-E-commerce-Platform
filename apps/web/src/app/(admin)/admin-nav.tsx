'use client';

import { BarChart3, LayoutDashboard, Package, Receipt, Settings, ShieldCheck, Tag, Tags, Users, Store } from 'lucide-react';
import { Sidebar, type SidebarGroup } from '@/components/shell/sidebar';

const GROUPS: SidebarGroup[] = [
  {
    title: 'Command',
    items: [{ label: 'Overview', href: '/admin', icon: LayoutDashboard }],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: Tags },
      { label: 'Brands', href: '/admin/brands', icon: Tag },
      { label: 'Orders', href: '/admin/orders', icon: Receipt },
      { label: 'Coupons', href: '/admin/coupons', icon: Receipt },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Sellers', href: '/admin/sellers', icon: Store },
      { label: 'Reviews', href: '/admin/reviews', icon: ShieldCheck },
    ],
  },
  {
    title: 'Analytics',
    items: [{ label: 'Reports', href: '/admin/reports', icon: BarChart3 }],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', href: '/admin/settings', icon: Settings }],
  },
];

/** Admin command-center navigation (visually distinct from seller shell). */
export function AdminNav() {
  return <Sidebar groups={GROUPS} accent="command" />;
}
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Boxes,
  CreditCard,
  DollarSign,
  FileBarChart,
  Globe,
  Heart,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Megaphone,
  Package,
  Plug,
  Receipt,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Ticket,
  UserCircle,
  UserCog,
  Users,
  Webhook,
} from 'lucide-react';
import { tabsForRoles } from '@/components/account/tab-config';

/** A single navigation link. `tab` marks links that point at a /account/profile tab. */
export interface NavLinkItem {
  label: string;
  href: string;
  icon: LucideIcon;
  tab?: string;
}

/** A titled group of navigation links (used by the sidebar shell). */
export interface NavGroup {
  title: string;
  items: NavLinkItem[];
}

/**
 * Personal account section. Every role gets these links in the header dropdown
 * and the /account sidebar. Items with a `tab` only appear when the user's
 * roles grant that profile tab (see tabsForRoles).
 */
export const ACCOUNT_NAV: NavLinkItem[] = [
  { label: 'Dashboard', href: '/account/dash', icon: LayoutDashboard },
  { label: 'Profile', href: '/account/profile', icon: UserCircle },
  { label: 'Orders', href: '/account/orders', icon: ShoppingBag },
  { label: 'Wishlist', href: '/wishlist', icon: Heart },
  { label: 'Addresses', href: '/account/profile?tab=addresses', icon: MapPin, tab: 'addresses' },
  { label: 'Security', href: '/account/profile?tab=security', icon: ShieldCheck, tab: 'security' },
  { label: 'Preferences', href: '/account/profile?tab=preferences', icon: Settings2, tab: 'preferences' },
  { label: 'Activity', href: '/account/profile?tab=activity', icon: Activity, tab: 'activity' },
  { label: 'Permissions', href: '/account/profile?tab=permissions', icon: KeyRound, tab: 'permissions' },
  { label: 'Notifications', href: '/account/notifications', icon: Bell },
];

/** Seller workspace sidebar, grouped. */
export const SELLER_NAV_GROUPS: NavGroup[] = [
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

/** Flat seller links for the header dropdown "Seller" section. */
export const SELLER_NAV: NavLinkItem[] = SELLER_NAV_GROUPS.flatMap((group) => group.items);

/**
 * Control Center (multi-tenant Commerce Command Center) sidebar. Mirrors the
 * spec's nav tree. Links target /control-center/* — core modules are wired to
 * real APIs; the rest are scaffolded routes that resolve to coherent coming-soon
 * panels. The org switch is rendered by the shell above these groups.
 */
export const CONTROL_CENTER_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Command',
    items: [
      { label: 'Overview', href: '/control-center', icon: LayoutDashboard },
      { label: 'Storefront', href: '/control-center/store', icon: Store },
      { label: 'Analytics', href: '/control-center/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/control-center/products', icon: Package },
      { label: 'Categories', href: '/control-center/categories', icon: Tags },
      { label: 'Brands', href: '/control-center/brands', icon: BadgeCheck },
      { label: 'Inventory', href: '/control-center/inventory', icon: Boxes },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Orders', href: '/control-center/orders', icon: ShoppingBag },
      { label: 'Customers', href: '/control-center/customers', icon: Users },
      { label: 'Coupons', href: '/control-center/coupons', icon: Ticket },
      { label: 'Marketing', href: '/control-center/marketing', icon: Megaphone },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Revenue', href: '/control-center/finance/revenue', icon: DollarSign },
      { label: 'Transactions', href: '/control-center/finance/transactions', icon: Receipt },
      { label: 'Payouts', href: '/control-center/finance/payouts', icon: Landmark },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Reports', href: '/control-center/reports', icon: FileBarChart },
      { label: 'Insights', href: '/control-center/insights', icon: Lightbulb },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Team', href: '/control-center/team', icon: UserCog },
      { label: 'Roles', href: '/control-center/roles', icon: KeyRound },
      { label: 'Activity', href: '/control-center/activity', icon: Activity },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Integrations', href: '/control-center/integrations', icon: Plug },
      { label: 'Domains', href: '/control-center/domains', icon: Globe },
      { label: 'API & Webhooks', href: '/control-center/webhooks', icon: Webhook },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', href: '/control-center/notifications', icon: Bell },
      { label: 'Security', href: '/control-center/security', icon: ShieldCheck },
      { label: 'Billing', href: '/control-center/billing', icon: CreditCard },
      { label: 'Settings', href: '/control-center/settings', icon: Settings2 },
    ],
  },
];

export const CONTROL_CENTER_NAV: NavLinkItem[] = CONTROL_CENTER_NAV_GROUPS.flatMap((g) => g.items);

/**
 * Admin workspace quick links for the header dropdown "Admin" section.
 * Orders is intentionally not listed here — admins get it from their account
 * nav (which points at /admin/orders), so no link ever appears twice.
 */
export const ADMIN_NAV: NavLinkItem[] = [
  { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Sellers', href: '/admin/sellers', icon: Store },
  { label: 'Products', href: '/admin/products', icon: Package },
];

/**
 * Account nav filtered by the user's roles — the exact list the /account
 * sidebar shows, shared so the header dropdown can never disagree with it.
 * - Tab-scoped links only appear when the role grants that profile tab.
 * - Admins don't get the consumer Wishlist, and their Orders link targets the
 *   admin order queue.
 */
export function buildAccountNav(roles: string[]): NavLinkItem[] {
  const tabs = new Set(tabsForRoles(roles).map((tab) => tab.id));
  const isAdmin = roles.includes('ADMIN');
  return ACCOUNT_NAV.map((item) =>
    item.label === 'Orders' && isAdmin ? { ...item, href: '/admin/orders' } : item,
  ).filter((item) => {
    if (item.label === 'Wishlist' && isAdmin) return false;
    if (item.tab && !tabs.has(item.tab)) return false;
    return true;
  });
}

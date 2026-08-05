import {
  Activity,
  BadgeCheck,
  Briefcase,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Settings2,
  ShieldCheck,
  Store,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export interface AccountTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** Tabs shown per role, in display order. */
const ROLE_TABS: Record<string, AccountTab[]> = {
  CUSTOMER: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'personal', label: 'Personal Info', icon: UserCircle },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'activity', label: 'Activity', icon: Activity },
  ],
  SELLER: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'personal', label: 'Personal Info', icon: UserCircle },
    { id: 'business', label: 'Business', icon: Briefcase },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'verification', label: 'Verification', icon: BadgeCheck },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ],
  ADMIN: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'personal', label: 'Personal Info', icon: UserCircle },
    { id: 'permissions', label: 'Permissions', icon: KeyRound },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'activity', label: 'Activity', icon: Activity },
  ],
};

/**
 * Merge the tab sets for every role the user has, most privileged first, deduped.
 *
 * Admins do not sell: an ADMIN role shows the admin workspace only, even if the
 * account also holds SELLER/CUSTOMER roles.
 */
export function tabsForRoles(roles: string[]): AccountTab[] {
  if (roles.includes('ADMIN')) return [...ROLE_TABS.ADMIN];

  const priority = ['SELLER', 'CUSTOMER'];
  const ordered = priority
    .filter((role) => roles.includes(role))
    .flatMap((role) => ROLE_TABS[role] ?? []);

  const seen = new Set<string>();
  return ordered.filter((tab) => {
    if (seen.has(tab.id)) return false;
    seen.add(tab.id);
    return true;
  });
}

export const ACCOUNT_TAB_IDS = [
  'overview',
  'personal',
  'addresses',
  'security',
  'preferences',
  'activity',
  'business',
  'store',
  'verification',
  'permissions',
] as const;

export type AccountTabId = (typeof ACCOUNT_TAB_IDS)[number];

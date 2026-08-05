'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  Heart,
  KeyRound,
  MapPin,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  UserCircle,
} from 'lucide-react';
import { RoleBadge } from '@/components/3d/role-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { tabsForRoles } from '@/components/account/tab-config';
import { useAuthenticated } from '@/hooks/use-auth';
import { usersApi, type UserProfile } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  tab?: string;
}

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Customer',
  SELLER: 'Seller',
  ADMIN: 'Administrator',
};

/**
 * Personal account navigation, derived from the profile tabs the user's roles
 * actually get. Dashboards are NOT listed here — the header dropdown links to
 * them — so the account area stays focused on the account itself.
 */
function buildAccountNav(roles: string[]): NavItem[] {
  const tabs = tabsForRoles(roles).map((tab) => tab.id);
  const isAdmin = roles.includes('ADMIN');
  const items: NavItem[] = [
    { label: 'Profile', href: '/account/profile', icon: UserCircle },
    {
      label: 'Orders',
      href: isAdmin ? '/admin/orders' : '/account/orders',
      icon: ShoppingBag,
    },
  ];
  if (!isAdmin) items.push({ label: 'Wishlist', href: '/wishlist', icon: Heart });
  if (tabs.includes('addresses')) items.push({ label: 'Addresses', href: '/account/profile?tab=addresses', icon: MapPin, tab: 'addresses' });
  if (tabs.includes('security')) items.push({ label: 'Security', href: '/account/profile?tab=security', icon: ShieldCheck, tab: 'security' });
  if (tabs.includes('preferences')) items.push({ label: 'Preferences', href: '/account/profile?tab=preferences', icon: Settings2, tab: 'preferences' });
  if (tabs.includes('activity')) items.push({ label: 'Activity', href: '/account/profile?tab=activity', icon: Activity, tab: 'activity' });
  if (tabs.includes('permissions')) items.push({ label: 'Permissions', href: '/account/profile?tab=permissions', icon: KeyRound, tab: 'permissions' });
  items.push({ label: 'Notifications', href: '/account/notifications', icon: Bell });
  return items;
}

function NavLink({ item, pathname, profileTab }: { item: NavItem; pathname: string; profileTab: string | null }) {
  const active = item.tab
    ? profileTab === item.tab
    : pathname === item.href || pathname.startsWith(item.href + '/');
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

function ProfileCard({ profile, loading }: { profile: UserProfile | undefined; loading: boolean }) {
  if (loading) {
    return (
      <Card className="p-4">
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const roles = profile.roles.filter((r) => ROLE_LABEL[r]);

  return (
    <Card className="p-4">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.name ?? profile.email}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {(profile.name ?? profile.email ?? '?').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile.name ?? 'No name set'}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authed, ready } = useAuthenticated();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.me,
    enabled: ready && authed,
  });

  // Read the active profile tab from the URL without SSR-sensitive useSearchParams.
  const [profileTab, setProfileTab] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProfileTab(params.get('tab'));
  }, [pathname]);

  const nav = buildAccountNav(profile?.roles ?? []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Mobile navigation */}
      <div className="-mx-4 mb-6 overflow-x-auto border-b px-4 pb-3 lg:hidden" aria-label="Account navigation (mobile)">
        <div className="flex gap-1.5">
          {nav.map((item) => (
            <Link
              key={item.href + (item.tab ?? '')}
              href={item.href}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                item.tab
                  ? profileTab === item.tab
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent'
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <ProfileCard profile={profile} loading={isLoading} />
          <nav aria-label="Account navigation" className="mt-4 space-y-2">
            <p className="px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Account</p>
            {nav.map((item) => (
              <NavLink key={item.href + (item.tab ?? '')} item={item} pathname={pathname} profileTab={profileTab} />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  );
}

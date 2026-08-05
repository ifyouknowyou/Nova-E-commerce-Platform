'use client';

import { Lock, UserCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserProfile } from '@/lib/profile';
import { tabsForRoles } from './tab-config';
import { ActivityTab } from './tabs/activity-tab';
import { AddressesTab } from './tabs/addresses-tab';
import { BusinessTab } from './tabs/business-tab';
import { OverviewTab } from './tabs/overview-tab';
import { PermissionsTab } from './tabs/permissions-tab';
import { PersonalInfoTab } from './tabs/personal-info-tab';
import { PreferencesTab } from './tabs/preferences-tab';
import { SecurityTab } from './tabs/security-tab';
import { StoreTab } from './tabs/store-tab';
import { VerificationTab } from './tabs/verification-tab';

function TabContent({ id, profile }: { id: string; profile: UserProfile }) {
  switch (id) {
    case 'overview':
      return <OverviewTab profile={profile} />;
    case 'personal':
      return <PersonalInfoTab profile={profile} />;
    case 'security':
      return <SecurityTab email={profile.email} />;
    case 'preferences':
      return <PreferencesTab />;
    case 'addresses':
      return <AddressesTab />;
    case 'activity':
      return <ActivityTab profile={profile} />;
    case 'business':
      return <BusinessTab />;
    case 'store':
      return <StoreTab />;
    case 'verification':
      return <VerificationTab profile={profile} />;
    case 'permissions':
      return <PermissionsTab />;
    default:
      return null;
  }
}

function RestrictedPanel({ roles }: { roles: string[] }) {
  return (
    <div className="flex flex-col items-center rounded-xl border py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">This section is not available to your account</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Your current role{roles.length > 1 ? 's' : ''} ({roles.join(', ') || 'none'}) does not have access
        to this part of the profile.
      </p>
      <Button asChild className="mt-6">
        <a href="/account/profile">Back to overview</a>
      </Button>
    </div>
  );
}

export function ProfileTabs({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabs = tabsForRoles(profile.roles);
  const available = tabs.map((tab) => tab.id);

  const requested = searchParams.get('tab');
  const restricted = !!requested && requested !== 'overview' && !available.includes(requested);
  const active = available.includes(requested ?? '') ? (requested as string) : 'overview';

  if (restricted) return <RestrictedPanel roles={profile.roles} />;

  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'overview') params.delete('tab');
        else params.set('tab', value);
        const qs = params.toString();
        router.replace(qs ? `/account/profile?${qs}` : '/account/profile', { scroll: false });
      }}
    >
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto rounded-xl p-1.5">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-4">
          <TabContent id={tab.id} profile={profile} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function ProfileTabsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-md bg-muted" />
        ))}
      </div>
      <div className="flex items-center justify-center rounded-xl border py-16 text-sm text-muted-foreground">
        <UserCircle className="mr-2 h-5 w-5" />
        Loading your profile…
      </div>
    </div>
  );
}

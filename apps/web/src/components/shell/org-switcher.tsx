'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { controlCenterApi, type OrganizationResponse } from '@/lib/control-center';
import { setActiveOrgId } from '@/lib/active-org';

/**
 * Org context selector for the Control Center. Persists the chosen org id to
 * localStorage + a cookie (so server fetches and the API's x-organization-id
 * header can read it) and re-validates queries on change.
 */
export function OrgSwitcher() {
  const router = useRouter();
  const { data: orgs } = useQuery({
    queryKey: ['organizations', 'mine'],
    queryFn: () => controlCenterApi.myOrganizations(),
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('nova:org') : null;
    if (stored) {
      setActiveId(stored);
    } else if (orgs && orgs.length > 0) {
      setActiveId(orgs[0].id);
      setActiveOrgId(orgs[0].id);
    }
  }, [orgs]);

  const active: OrganizationResponse | undefined = orgs?.find((o) => o.id === activeId) ?? orgs?.[0];

  function choose(org: OrganizationResponse) {
    setActiveId(org.id);
    setActiveOrgId(org.id);
    setOpen(false);
    router.refresh();
  }

  if (!orgs || orgs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
        No organization yet. Create one from your seller dashboard.
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 text-left text-sm font-medium shadow-sm transition-colors hover:bg-accent"
      >
        <Building2 className="h-4 w-4 shrink-0 text-brand" />
        <span className="min-w-0 flex-1 truncate">{active?.name ?? 'Select org'}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/70 bg-popover shadow-xl">
          <ul className="max-h-72 overflow-y-auto py-1">
            {orgs.map((org) => (
              <li key={org.id}>
                <button
                  type="button"
                  onClick={() => choose(org)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{org.name}</span>
                  {org.id === active?.id && <Check className="h-4 w-4 shrink-0 text-brand" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

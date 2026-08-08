'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useSession } from '@/lib/api/session';
import { tierOf, tierLabel } from '@/lib/role-tier';
import { SrOnly } from '@/components/a11y';
import styles from './platform.module.css';

interface OrgEntry {
  id: string;
  organization: { id: string; name: string; slug: string };
}

const NAV = [
  { href: '/dashboard', label: 'Dashboard', roles: null },
  { href: '/crm/pipeline', label: 'CRM', roles: null },
  { href: '/sales', label: 'Sales', roles: null },
  { href: '/projects', label: 'Projects', roles: null },
  { href: '/finance', label: 'Finance', roles: null },
  { href: '/inventory', label: 'Inventory', roles: null },
  { href: '/support', label: 'Support', roles: null },
  { href: '/hr', label: 'Team', roles: null },
  { href: '/documents', label: 'Documents', roles: null },
  { href: '/search', label: 'Search', roles: null },
  { href: '/notifications', label: 'Notifications', roles: null },
  { href: '/automation', label: 'Automation', roles: null },
  { href: '/copilot', label: 'Copilot', roles: null },
  { href: '/agents', label: 'Agents', roles: null },
  { href: '/approvals', label: 'Approvals', roles: null },
  { href: '/graph', label: 'Business Graph', roles: null },
  { href: '/audit', label: 'Audit', roles: null },
  { href: '/observability', label: 'Observability', roles: ['OWNER', 'ADMIN'] },
  { href: '/settings', label: 'Settings', roles: null },
  { href: '/settings/security', label: 'Security', roles: null },
  { href: '/integrations', label: 'Integrations', roles: ['OWNER', 'ADMIN'] },
];

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user, signOut } = useSession();
  const [orgs, setOrgs] = useState<OrgEntry[]>([]);
  const [currentOrgName, setCurrentOrgName] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [loading, user, router]);

  // Collapse the mobile drawer once navigation happens.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    apiFetch<OrgEntry[]>('/orgs/my').then(setOrgs).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ id: string; name: string }>('/orgs/current').then((o) => setCurrentOrgName(o.name)).catch(() => undefined);
  }, [user, pathname]);

  if (loading || !user) return <div className={styles.boot}>Loading NEXUS OS…</div>;

  async function switchOrg(orgId: string) {
    try {
      await apiFetch('/orgs/switch', { method: 'POST', body: JSON.stringify({ orgId }) });
      router.refresh();
      router.push('/dashboard');
    } catch {
      /* ignore */
    }
  }

  async function onSignOut() {
    await signOut();
    router.replace('/sign-in');
  }

  const visibleNav = NAV.filter((item) => !item.roles || item.roles.some((r) => user!.roles.includes(r)));
  const tier = tierOf(user.roles);

  return (
    <div className={styles.shell}>
      <a href="#main-content" className="nexus-skip">Skip to content</a>

      <header className={styles.mobileTopBar}>
        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
        >
          ☰<SrOnly>{menuOpen ? 'Close navigation' : 'Open navigation'}</SrOnly>
        </button>
        <span className={styles.brand}>NEXUS OS</span>
      </header>

      {menuOpen && <div className={styles.sidebarOverlay} onClick={() => setMenuOpen(false)} />}

      <aside
        id="app-sidebar"
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}
        aria-label="Main navigation"
      >
        <div className={styles.brand}>
          NEXUS OS <span className={styles.tierBadge}>{tierLabel(tier)}</span>
        </div>

        <div className={styles.orgBox}>
          <span className={styles.orgLabel}>Organization</span>
          <select
            className={styles.orgSelect}
            value={user.orgId}
            onChange={(e) => switchOrg(e.target.value)}
          >
            <option value={user.orgId}>{currentOrgName || user.orgId.slice(0, 8)}</option>
            {orgs.filter((o) => o.id !== user.orgId).map((o) => (
              <option key={o.id} value={o.id}>{o.organization.name}</option>
            ))}
          </select>
        </div>

        <nav className={styles.nav}>
          {visibleNav.map((item) => (
            <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? styles.navActive : styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.user}>{user.email}</div>
          <div className={styles.roles}>{user.roles.join(' · ')}</div>
          <button className={styles.signOut} onClick={onSignOut}>Sign out</button>
        </div>
      </aside>

      <main id="main-content" className={styles.content} tabIndex={-1}>{children}</main>
    </div>
  );
}
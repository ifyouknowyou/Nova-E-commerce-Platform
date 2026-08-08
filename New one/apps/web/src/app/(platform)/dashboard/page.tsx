'use client';

import dynamic from 'next/dynamic';
import { useSession } from '@/lib/api/session';
import { tierOf } from '@/lib/role-tier';
import { useDashboardData } from './use-dashboard';
import TwoDTier from './two-dashboard';

// Three.js is loaded ONLY for OWNER/ADMIN (never in the shared main bundle).
const ExecutiveScene = dynamic(() => import('./executive/ExecutiveScene'), { ssr: false });

export default function DashboardPage() {
  const { user } = useSession();
  const tier = tierOf(user?.roles);
  const data = useDashboardData();

  // For unknown/loading sessions render nothing until the shell resolves auth.
  if (!user) return null;

  if (tier === 'owner'){
    return (
      <div style={{ maxWidth: 1280 }}>
        <h1 style={{ fontWeight: 700 }}>Executive Command Center</h1>
        <p style={{ color: 'var(--nexus-muted)' }}>Performance has priority over visual effects — this view reads live data from your selected org.</p>
        <ExecutiveScene />
        <div style={{ marginTop: 20 }}>
          <TwoDTier data={data} tier="manager" />
        </div>
      </div>
    );
  }

  return <TwoDTier data={data} tier={tier} />;
}
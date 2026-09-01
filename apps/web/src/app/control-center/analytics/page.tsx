'use client';

import { BarChart3 } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function AnalyticsPage() {
  return (
    <ModuleScaffold
      title="Analytics"
      description="Trends, cohorts and revenue intelligence for the organization."
      icon={BarChart3}
      planned={["Revenue trends","Cohort retention","Channel attribution","Custom dashboards"]}
    />
  );
}

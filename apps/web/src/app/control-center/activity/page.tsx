'use client';

import { Activity } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function ActivityPage() {
  return (
    <ModuleScaffold
      title="Activity"
      description="Audit trail of actions across the org."
      icon={Activity}
      planned={["Audit log","Filters"]}
    />
  );
}

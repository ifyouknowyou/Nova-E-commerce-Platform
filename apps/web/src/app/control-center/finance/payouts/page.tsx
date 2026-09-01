'use client';

import { Landmark } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function PayoutsPage() {
  return (
    <ModuleScaffold
      title="Payouts"
      description="Scheduled and completed payouts to your bank."
      icon={Landmark}
      planned={["Schedule","History","Reconciliation"]}
    />
  );
}

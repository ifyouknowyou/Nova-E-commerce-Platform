'use client';

import { Ticket } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function CouponsPage() {
  return (
    <ModuleScaffold
      title="Coupons"
      description="Org-wide discount codes and automations."
      icon={Ticket}
      planned={["Code builder","Auto-apply rules","Usage reports"]}
    />
  );
}

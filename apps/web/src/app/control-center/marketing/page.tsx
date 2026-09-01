'use client';

import { Megaphone } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function MarketingPage() {
  return (
    <ModuleScaffold
      title="Marketing"
      description="Campaigns, email and promotions."
      icon={Megaphone}
      planned={["Email campaigns","Popups","Affiliates"]}
    />
  );
}

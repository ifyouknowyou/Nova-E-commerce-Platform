'use client';

import { DollarSign } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function RevenuePage() {
  return (
    <ModuleScaffold
      title="Revenue"
      description="Gross, net and commission breakdowns."
      icon={DollarSign}
      planned={["Gross vs net","By store","By period"]}
    />
  );
}

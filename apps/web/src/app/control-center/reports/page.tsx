'use client';

import { FileBarChart } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function ReportsPage() {
  return (
    <ModuleScaffold
      title="Reports"
      description="Exportable operational reports."
      icon={FileBarChart}
      planned={["Sales","Tax","Inventory"]}
    />
  );
}

'use client';

import { Package } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function ProductsPage() {
  return (
    <ModuleScaffold
      title="Products"
      description="Manage your full catalog across every store in the organization."
      icon={Package}
      planned={["List & bulk edit","Create / duplicate","Collections","Approval workflow"]}
    />
  );
}

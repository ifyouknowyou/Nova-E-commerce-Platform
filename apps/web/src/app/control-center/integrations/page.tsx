'use client';

import { Plug } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function IntegrationsPage() {
  return (
    <ModuleScaffold
      title="Integrations"
      description="Connect third-party apps and services."
      icon={Plug}
      planned={["Marketplace","Connections"]}
    />
  );
}

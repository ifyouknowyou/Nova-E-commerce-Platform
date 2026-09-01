'use client';

import { Globe } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function DomainsPage() {
  return (
    <ModuleScaffold
      title="Domains"
      description="Custom domains and DNS for your storefront."
      icon={Globe}
      planned={["Add domain","Verify DNS","SSL"]}
    />
  );
}

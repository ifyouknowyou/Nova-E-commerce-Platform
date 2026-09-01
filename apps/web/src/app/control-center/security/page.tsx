'use client';

import { ShieldCheck } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function SecurityPage() {
  return (
    <ModuleScaffold
      title="Security"
      description="Sessions, 2FA and access review."
      icon={ShieldCheck}
      planned={["Sessions","2FA","Access review"]}
    />
  );
}

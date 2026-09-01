'use client';

import { KeyRound } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function RolespermissionsPage() {
  return (
    <ModuleScaffold
      title="Roles & permissions"
      description="Org-scoped role codes and access."
      icon={KeyRound}
      planned={["Role matrix","Custom roles"]}
    />
  );
}

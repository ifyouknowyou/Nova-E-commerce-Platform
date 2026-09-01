'use client';

import { UserCog } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function TeamPage() {
  return (
    <ModuleScaffold
      title="Team"
      description="Invite members and manage their org membership."
      icon={UserCog}
      planned={["Invite","Roles","Status"]}
    />
  );
}

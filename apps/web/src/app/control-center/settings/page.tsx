'use client';

import { Settings2 } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function SettingsPage() {
  return (
    <ModuleScaffold
      title="Settings"
      description="Organization profile and configuration."
      icon={Settings2}
      planned={["Profile","Tax & shipping","Danger zone"]}
    />
  );
}

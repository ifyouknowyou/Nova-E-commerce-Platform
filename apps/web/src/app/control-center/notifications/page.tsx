'use client';

import { Bell } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function NotificationsPage() {
  return (
    <ModuleScaffold
      title="Notifications"
      description="Org notification preferences and center."
      icon={Bell}
      planned={["Preferences","In-app center"]}
    />
  );
}

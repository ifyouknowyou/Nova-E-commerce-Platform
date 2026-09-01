'use client';

import { Webhook } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function APIWebhooksPage() {
  return (
    <ModuleScaffold
      title="API & Webhooks"
      description="Outbound webhooks and API keys."
      icon={Webhook}
      planned={["Endpoints","Secrets","Logs"]}
    />
  );
}

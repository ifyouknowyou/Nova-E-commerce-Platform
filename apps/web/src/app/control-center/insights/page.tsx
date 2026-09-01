'use client';

import { Lightbulb } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function InsightsPage() {
  return (
    <ModuleScaffold
      title="Insights"
      description="AI-surfaced opportunities and anomalies."
      icon={Lightbulb}
      planned={["Anomaly alerts","Recommendations"]}
    />
  );
}

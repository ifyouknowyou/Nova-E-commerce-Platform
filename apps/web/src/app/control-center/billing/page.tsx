'use client';

import { CreditCard } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function BillingPage() {
  return (
    <ModuleScaffold
      title="Billing"
      description="Subscription plan and invoices."
      icon={CreditCard}
      planned={["Plan","Invoices","Payment method"]}
    />
  );
}

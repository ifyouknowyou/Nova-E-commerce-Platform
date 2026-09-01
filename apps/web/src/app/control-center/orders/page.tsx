'use client';

import { ShoppingBag } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function OrdersPage() {
  return (
    <ModuleScaffold
      title="Orders"
      description="Fulfillment center for every order placed across your stores."
      icon={ShoppingBag}
      planned={["Order queue","Fulfill & ship","Returns & refunds","Invoices"]}
    />
  );
}

'use client';

import { Receipt } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function TransactionsPage() {
  return (
    <ModuleScaffold
      title="Transactions"
      description="Every payment and payout movement."
      icon={Receipt}
      planned={["Ledger","Filters","Export"]}
    />
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { KPI3DCard } from '@/components/3d/kpi-3d-card';
import { controlCenterApi } from '@/lib/control-center';
import type { FinancialSummary } from '@/lib/control-center';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, DollarSign, Wallet } from 'lucide-react';

export default function FinancePage() {
  const { data, isError, refetch } = useQuery({
    queryKey: ['control-center', 'finance-summary'],
    queryFn: () => controlCenterApi.financeSummary(),
  });

  const summary = data as FinancialSummary | undefined;

  return (
    <div className="space-y-8">
      <Reveal3D>
        <PageHeader
          title="Finance"
          subtitle="Revenue, transactions, and payout overview."
        />
      </Reveal3D>

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed to load finance data. Please try again.
          </span>
          <button onClick={() => refetch()} className="text-sm underline">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <Reveal3D delay={0.1}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI3DCard
            label="Total Revenue"
            value={summary ? summary.totalRevenue : 0}
            prefix="$"
            icon={DollarSign}
          />
          <KPI3DCard
            label="Settled Payments"
            value={summary?.settledPayments ?? 0}
            prefix="$"
            icon={ArrowDownCircle}
          />
          <KPI3DCard
            label="Pending Payments"
            value={summary?.pendingPayments ?? 0}
            prefix="$"
            icon={ArrowUpCircle}
          />
          <KPI3DCard
            label="Pending Payouts"
            value={summary?.pendingPayouts ?? 0}
            prefix="$"
            icon={Wallet}
          />
        </div>
      </Reveal3D>

      {/* Quick Links */}
      <Reveal3D delay={0.2}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.totalRevenue ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">View detailed revenue analytics</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.settledPayments ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">View all payment transactions</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-yellow-600" />
                Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.pendingPayouts ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">View pending and settled payouts</p>
            </CardContent>
          </Card>
        </div>
      </Reveal3D>
    </div>
  );
}
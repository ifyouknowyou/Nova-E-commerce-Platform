'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { KPI3DCard } from '@/components/3d/kpi-3d-card';
import { controlCenterApi } from '@/lib/control-center';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart3, DollarSign, Package, Tag, Users } from 'lucide-react';

interface InsightsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

export default function InsightsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['control-center', 'insights'],
    queryFn: async (): Promise<InsightsData> => {
      const overview = await controlCenterApi.overview();
      return {
        totalRevenue: overview.kpis.revenue,
        totalOrders: overview.kpis.orders,
        totalCustomers: overview.kpis.customers,
        totalProducts: overview.kpis.products,
      };
    },
  });

  const insights = data;

  return (
    <div className="space-y-8">
      <Reveal3D>
        <PageHeader
          title="Insights"
          subtitle="Key performance metrics and analytics for your business."
        />
      </Reveal3D>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed to load insights. Please try again.
          </span>
          <button onClick={() => refetch()} className="text-sm underline">
            Retry
          </button>
        </div>
      )}

      <Reveal3D delay={0.1}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPI3DCard
            label="Revenue"
            value={insights?.totalRevenue ?? 0}
            prefix="$"
            icon={DollarSign}
          />
          <KPI3DCard
            label="Orders"
            value={insights?.totalOrders ?? 0}
            icon={Tag}
          />
          <KPI3DCard
            label="Customers"
            value={insights?.totalCustomers ?? 0}
            icon={Users}
          />
          <KPI3DCard
            label="Products"
            value={insights?.totalProducts ?? 0}
            icon={Package}
          />
          <KPI3DCard
            label="Low Stock"
            value={0}
            icon={Package}
          />
        </div>
      </Reveal3D>

      <Reveal3D delay={0.2}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Sales Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Loading trends...
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mr-2 opacity-50" />
                <span>Revenue trend chart placeholder</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal3D>
    </div>
  );
}
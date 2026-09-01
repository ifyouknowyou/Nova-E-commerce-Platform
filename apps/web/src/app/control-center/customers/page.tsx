'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Input } from '@/components/ui/input';
import { controlCenterApi } from '@/lib/control-center';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

export default function ControlCenterCustomersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['control-center', 'customers', search],
    queryFn: () => controlCenterApi.customers(search || undefined),
  });

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-8">
      <PageHeader title="Customers" subtitle="Everyone who has bought from your organization's stores." />
      <div className="max-w-sm">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Reveal3D>
        <SpatialPanel depth={4} className="p-6">
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-md bg-muted/50" />
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No customers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">Customer</th>
                    <th className="py-2 pr-4 font-semibold">Orders</th>
                    <th className="py-2 pr-4 font-semibold">Lifetime value</th>
                    <th className="py-2 font-semibold">Last order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((c) => (
                    <tr key={c.userId ?? c.email}>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{c.name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </td>
                      <td className="py-3 pr-4">{formatNumber(c.orders)}</td>
                      <td className="py-3 pr-4 font-semibold">{formatCurrency(c.lifetimeValue)}</td>
                      <td className="py-3 text-muted-foreground">
                        {c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4" />
            {formatNumber(rows.length)} customers
          </div>
        </SpatialPanel>
      </Reveal3D>
    </div>
  );
}

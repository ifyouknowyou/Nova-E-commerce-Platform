'use client';

import { useQuery } from '@tanstack/react-query';
import { Boxes, PackageX } from 'lucide-react';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Button } from '@/components/ui/button';
import { controlCenterApi } from '@/lib/control-center';

export default function ControlCenterInventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['control-center', 'inventory'],
    queryFn: () => controlCenterApi.inventory(false),
  });

  const low = (data ?? []).filter((r) => r.stock <= r.lowStockThreshold);
  const healthy = (data ?? []).filter((r) => r.stock > r.lowStockThreshold);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory health"
        subtitle="Stock levels across every store in your organization."
        actions={
          <Button asChild variant="outline">
            <a href="/dashboard/inventory">Manage in seller dashboard</a>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat icon={Boxes} label="Tracked SKUs" value={(data ?? []).length} tone="primary" />
        <Stat icon={PackageX} label="Low stock" value={low.length} tone="warning" />
        <Stat icon={Boxes} label="Healthy" value={healthy.length} tone="success" />
      </div>

      <Reveal3D>
        <SpatialPanel depth={4} className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <PackageX className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold">Needs attention ({low.length})</h2>
          </div>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-md bg-muted/50" />
          ) : low.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">All stock healthy.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {low.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.store.name} · {r.sku}
                    </span>
                  </span>
                  <span className="rounded-md bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
                    {r.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SpatialPanel>
      </Reveal3D>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning';
}) {
  const toneCls = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }[tone];
  return (
    <SpatialPanel depth={2} className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </SpatialPanel>
  );
}

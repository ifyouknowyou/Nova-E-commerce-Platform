'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { sellerApi } from '@/lib/seller';

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as const;

/** Four-step fulfillment progress bar (muted when cancelled). */
function StatusSteps({ status }: { status: string }) {
  const idx = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {STATUS_FLOW.map((s, i) => (
        <span
          key={s}
          title={s}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors duration-500',
            idx >= 0 && i <= idx ? 'bg-primary' : 'bg-muted',
          )}
        />
      ))}
    </div>
  );
}

export default function SellerOrdersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['seller-orders'], queryFn: () => sellerApi.listOrders(1, 50) });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => sellerApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast.success('Order status updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Update failed'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Fulfill and ship orders from your store" />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center rounded-xl border py-12 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data!.items.map((order) => (
            <SpatialPanel key={order.id} depth={2} spotlight className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{order.name}</p>
                <p className="text-xs text-muted-foreground">
                  {order.quantity} × {formatCurrency(order.total / order.quantity)} · {formatDate(order.placedAt)}
                </p>
                <div className="mt-3 max-w-xs">
                  <StatusSteps status={order.status} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{order.status.toLowerCase()}</Badge>
                {order.status === 'DELIVERED' || order.status === 'CANCELLED' ? null : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void update.mutate({
                        id: order.id,
                        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status === 'CONFIRMED' ? 'SHIPPED' : 'DELIVERED',
                      })
                    }
                  >
                    Advance status
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  disabled={order.status === 'CANCELLED'}
                  onClick={() => void update.mutate({ id: order.id, status: 'CANCELLED' })}
                >
                  Cancel
                </Button>
              </div>
            </SpatialPanel>
          ))}
        </div>
      )}
    </div>
  );
}
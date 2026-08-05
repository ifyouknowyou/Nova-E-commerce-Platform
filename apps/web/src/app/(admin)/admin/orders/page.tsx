'use client';

import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { PageHeader } from '@/components/3d/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/admin';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_TONE: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  DELIVERED: 'success',
  COMPLETED: 'success',
  PENDING: 'warning',
  PROCESSING: 'default',
  SHIPPED: 'default',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

export default function AdminOrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: () => adminApi.orders(1) });

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="All platform orders" />

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {data!.items.map((order) => (
            <Card key={order.id} className="overflow-hidden transition-shadow hover:depth-2">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{order.invoiceNumber ?? order.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.email} · {order.itemCount} item(s) · {formatDate(order.placedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_TONE[order.status] ?? 'secondary'} className="capitalize">
                    {order.status.toLowerCase()}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    pay {order.paymentStatus.toLowerCase()}
                  </Badge>
                  <span className="font-semibold">{formatCurrency(order.total)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
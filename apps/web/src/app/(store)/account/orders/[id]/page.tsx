'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Circle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CardPaymentForm } from '@/components/payment/card-payment-form';
import { ordersApi } from '@/lib/orders';
import { formatCurrency, formatDate } from '@/lib/utils';

const CANCELLABLE = new Set(['PENDING', 'CONFIRMED']);

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.detail(id),
  });

  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id),
    onSuccess: (next) => {
      queryClient.setQueryData(['order', id], next);
      toast.success('Order cancelled');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not cancel'),
  });

  const [payOpen, setPayOpen] = useState(false);

  if (isLoading) return <p className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Loading order…</p>;
  if (!order) return <p className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Order not found.</p>;

  const cancellable = CANCELLABLE.has(order.status);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={`Order ${order.invoiceNumber ?? order.id}`}
        subtitle={`Placed ${formatDate(order.placedAt)}`}
        actions={
          <>
            <Badge variant="secondary" className="capitalize">{order.status.toLowerCase()}</Badge>
            {order.paymentStatus === 'PENDING' && (
              <Button size="sm" onClick={() => setPayOpen(true)}>
                Pay now
              </Button>
            )}
            {cancellable && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500"
                disabled={cancel.isPending}
                onClick={() => void cancel.mutate()}
              >
                {cancel.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Cancel order
              </Button>
            )}
          </>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="divide-y p-0">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <Link href={`/products/${item.productId}`} className="line-clamp-1 text-sm font-medium hover:text-primary">
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
                  </div>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Timeline items={order.timeline} />
        </div>

        <div>
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-semibold">Summary</h2>
              <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
              {order.discount > 0 && <Row label="Discount" value={`−${formatCurrency(order.discount)}`} />}
              <Row label="Shipping" value={order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)} />
              <Separator />
              <Row label="Total" value={formatCurrency(order.total)} strong />
              <p className="pt-2 text-xs text-muted-foreground">Payment: {order.paymentStatus.toLowerCase()}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay for your order</DialogTitle>
            <DialogDescription>
              Enter your card details to complete the payment of {formatCurrency(order.total)}.
            </DialogDescription>
          </DialogHeader>
          <CardPaymentForm
            orderId={order.id}
            total={order.total}
            postalCode={order.shippingPostalCode ?? ''}
            onPaid={() => {
              setPayOpen(false);
              queryClient.invalidateQueries({ queryKey: ['order', id] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-semibold' : 'text-sm'}`}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Timeline({ items }: { items: { id: string; status: string; note: string | null; createdAt: string }[] }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-4 font-semibold">Timeline</h2>
        <ol className="space-y-4">
          {items.map((entry, i) => (
            <li key={entry.id} className="flex gap-3">
              <span className="mt-0.5">
                {i === items.length - 1 ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
              <div>
                <p className="text-sm font-medium capitalize">{entry.status.toLowerCase()}</p>
                {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
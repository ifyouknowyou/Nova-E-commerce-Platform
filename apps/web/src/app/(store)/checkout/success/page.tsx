'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ordersApi } from '@/lib/orders';
import { formatCurrency } from '@/lib/utils';

export default function Page() {
  return (
    <Suspense fallback={<p>Loading&hellip;</p>}>
      <Body />
    </Suspense>
  );
}

function Body() {
  const params = useSearchParams();
  const orderId = params.get('orderId') ?? '';

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.detail(orderId),
    enabled: !!orderId,
  });

  const order = query.data;
  const awaiting = order?.paymentStatus === 'PENDING';

  return (
    <div className="relative overflow-hidden bg-role-soft">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <span className="animate-pop">
            <CheckCircle2 className="h-11 w-11 text-emerald-500" />
          </span>
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
          Thank you — your order is placed!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {awaiting
            ? 'Your order is awaiting payment.'
            : 'Your order has been confirmed. We’ll send shipping updates to your inbox.'}
        </p>

        {order ? (
          <Card className="mt-6 overflow-hidden text-left depth-2 hairline">
            <CardContent className="space-y-3 p-6">
              <Row label="Order number" value={order.invoiceNumber ?? order.id} />
              <Row label="Total" value={formatCurrency(order.total)} />
              <Row label="Status" value={order.status.toLowerCase()} />
              <Row label="Payment" value={order.paymentStatus.toLowerCase()} />
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/products">Continue shopping</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/account/orders">View my orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
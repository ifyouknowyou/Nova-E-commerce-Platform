'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, Truck, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { DepthCard } from '@/components/3d/depth-card';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { Button } from '@/components/ui/button';
import { ordersApi } from '@/lib/orders';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
    <div className="relative min-h-screen overflow-hidden bg-role-soft">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/8 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-success/8 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-lg px-4 py-16 text-center">
        {/* Success Animation */}
        <Reveal3D>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 12 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success/10 shadow-lg"
          >
            <CheckCircle2 className="h-14 w-14 text-success" />
          </motion.div>
        </Reveal3D>

        <Reveal3D delay={0.1}>
          <h1 className="text-3xl font-bold tracking-tight">Order Placed!</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </Reveal3D>

        {order && (
          <Reveal3D delay={0.2}>
            <SpatialPanel depth={3} className="mt-8 text-left">
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-sm text-muted-foreground">Order Number</span>
                <span className="font-mono font-semibold">{order.id}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-b pb-4">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(order.total)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-b pb-4">
                <span className="text-sm text-muted-foreground">Payment</span>
                <span className={cn(
                  'rounded-full px-3 py-0.5 text-xs font-semibold',
                  order.paymentStatus === 'PAID' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
                )}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between pb-4">
                <span className="text-sm text-muted-foreground">Estimated Delivery</span>
                <span className="text-sm font-medium">3-7 business days</span>
              </div>

              {/* Order Timeline */}
              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Order Status</p>
                <div className="space-y-3">
                  {[
                    { label: 'Order Placed', icon: Package, done: true },
                    { label: 'Payment Confirmed', icon: CreditCard, done: order.paymentStatus === 'PAID' },
                    { label: 'Processing', icon: Sparkles, done: false },
                    { label: 'Shipped', icon: Truck, done: false },
                    { label: 'Delivered', icon: CheckCircle2, done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2',
                        step.done
                          ? 'border-success bg-success/10 text-success'
                          : 'border-muted bg-muted/20 text-muted-foreground',
                      )}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        'text-sm',
                        step.done ? 'font-medium text-foreground' : 'text-muted-foreground',
                      )}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SpatialPanel>
          </Reveal3D>
        )}

        <Reveal3D delay={0.3}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1 rounded-full">
              <Link href="/account/orders">
                <Package className="mr-2 h-4 w-4" />
                View My Orders
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1 rounded-full">
              <Link href="/">
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </Reveal3D>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-base font-semibold' : 'text-sm'}`}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

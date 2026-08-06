'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';
import { useAuthenticated } from '@/hooks/use-auth';
import { couponsApi } from '@/lib/coupons';
import { ordersApi, type CheckoutOrderInput } from '@/lib/orders';
import { formatCurrency } from '@/lib/utils';

const checkoutSchema = z.object({
  line1: z.string().min(1, 'Street address is required').max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  shippingMethod: z.enum(['standard', 'express']),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponParam = searchParams.get('coupon');
  const { cart, isLoading, refresh } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const { authed, ready } = useAuthenticated();

  const form = useForm<FormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      phone: '',
      shippingMethod: 'standard',
      notes: '',
    },
  });

  const activeSubtotal = cart?.subtotal ?? 0;
  const shipping = activeSubtotal >= 50 || activeSubtotal === 0 ? 0 : form.watch('shippingMethod') === 'express' ? 9.99 : 4.99;
  const discount = couponDiscount;
  const total = Math.max(0, activeSubtotal - discount + shipping);

  // Validate the coupon carried over from the cart once the subtotal is known.
  useEffect(() => {
    if (!couponParam || activeSubtotal <= 0) return;
    void couponsApi
      .validate(couponParam, activeSubtotal)
      .then((result) => setCouponDiscount(result.discount))
      .catch(() => setCouponDiscount(0));
  }, [couponParam, activeSubtotal]);

  async function onSubmit(values: FormValues): Promise<void> {
    setSubmitting(true);
    try {
      const input: CheckoutOrderInput = {
        shipping: {
          line1: values.line1,
          line2: values.line2 ?? undefined,
          city: values.city,
          state: values.state ?? undefined,
          postalCode: values.postalCode,
          country: values.country,
          phone: values.phone || undefined,
        },
        shippingMethod: values.shippingMethod,
        notes: values.notes ?? undefined,
        couponCode: couponParam ?? undefined,
      };
      const order = await ordersApi.checkout(input);
      await refresh();

      // The order is created PENDING payment. Payment is completed on the
      // confirmation page — never auto-confirmed here, so an order is not shown
      // as paid until the customer actually pays.
      toast.success('Order placed');
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl border bg-role-soft p-8 depth-2">
          <h1 className="text-2xl font-bold">Sign in to checkout</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to be signed in to place an order. Your cart will be kept.
          </p>
          <Button asChild className="mt-6">
            <Link href={`/login?redirect=/checkout`}>Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>

      {isLoading ? (
        <p className="mt-4 text-muted-foreground">Loading cart…</p>
      ) : (cart?.items.length ?? 0) === 0 ? (
        <div className="mt-6 rounded-xl border bg-role-soft p-8 text-center depth-1">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <SpatialPanel depth={2} spotlight>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold">Shipping address</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="line1" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Street address</FormLabel>
                      <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="line2" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Apartment, suite (optional)</FormLabel>
                      <FormControl><Input placeholder="Apt 4B" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="Springfield" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl><Input placeholder="IL" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="postalCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl><Input placeholder="62704" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl><Input placeholder="US" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl><Input placeholder="+1 555 000 0000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </SpatialPanel>

            <SpatialPanel depth={2} spotlight>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold">Delivery</h2>
                <FormField control={form.control} name="shippingMethod" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger aria-label="Shipping method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard (3–7 days)</SelectItem>
                        <SelectItem value="express">Express (1–2 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </CardContent>
            </SpatialPanel>
          </div>

          <div>
            <SpatialPanel depth={3} glass className="h-fit">
              <CardContent className="space-y-3 p-6">
                <h2 className="text-lg font-semibold">Order summary</h2>
                <ul className="space-y-3 text-sm">
                  {cart?.items
                    .filter((item) => !item.savedForLater)
                    .map((item) => (
                      <li key={item.id} className="flex justify-between gap-3">
                        <span className="line-clamp-1 text-muted-foreground">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="font-medium">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
                      </li>
                    ))}
                </ul>
                <Separator />
                <Row label="Subtotal" value={formatCurrency(activeSubtotal)} />
                {discount > 0 && (
                  <Row label={`Discount (${couponParam})`} value={`−${formatCurrency(discount)}`} />
                )}
                <Row label="Shipping" value={shipping === 0 ? 'Free' : formatCurrency(shipping)} />
                <Separator />
                <Row label="Total" value={formatCurrency(total)} strong />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? 'Placing order…' : 'Place order'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By placing your order you agree to the Terms of Service.
                </p>
              </CardContent>
            </SpatialPanel>
          </div>
        </form>
        </Form>
      )}
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
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { couponsApi } from '@/lib/coupons';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem } = useCart();

  if (isLoading) return <CartSkeleton />;

  const activeItems = cart?.items.filter((item) => !item.savedForLater) ?? [];
  const savedItems = cart?.items.filter((item) => item.savedForLater) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Shopping cart</h1>

      {activeItems.length === 0 && savedItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {activeItems.map((item) => (
              <SpatialPanel key={item.id} depth={2} spotlight className="overflow-hidden">
                <CardContent className="flex items-center gap-4 p-4">
                  {item.product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-20 w-20 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="line-clamp-2 text-sm font-medium hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(item.priceSnapshot)} each
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1}
                        onClick={() => void updateItem({ itemId: item.id, data: { quantity: item.quantity - 1 } })}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 1.4, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                        className="w-8 text-center text-sm"
                      >
                        {item.quantity}
                      </motion.span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Increase quantity"
                        disabled={item.quantity >= item.product.stock}
                        onClick={() => void updateItem({ itemId: item.id, data: { quantity: item.quantity + 1 } })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => void updateItem({ itemId: item.id, data: { savedForLater: true } })}
                      >
                        Save for later
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger"
                        aria-label="Remove item"
                        onClick={() => void removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </SpatialPanel>
            ))}

            {savedItems.length > 0 && (
              <>
                <Separator />
                <h2 className="text-lg font-semibold">Saved for later</h2>
                {savedItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.priceSnapshot)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void updateItem({ itemId: item.id, data: { savedForLater: false } })}
                      >
                        Move to cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          <OrderSummary subtotal={cart?.subtotal ?? 0} />
        </div>
      )}
    </div>
  );
}

function OrderSummary({ subtotal }: { subtotal: number }) {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');
  const [checking, setChecking] = useState(false);

  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = Math.max(0, subtotal - discount + shipping);

  async function applyCoupon(): Promise<void> {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const result = await couponsApi.validate(code.trim(), subtotal);
      setDiscount(result.discount);
      setAppliedCode(result.code);
      if (result.discount > 0) toast.success(`Coupon applied: ${formatCurrency(result.discount)} off`);
      else toast.info('Coupon applied — no discount on this order');
    } catch (err) {
      setDiscount(0);
      setAppliedCode('');
      toast.error(err instanceof Error ? err.message : 'Invalid coupon');
    } finally {
      setChecking(false);
    }
  }

  function removeCoupon(): void {
    setCode('');
    setDiscount(0);
    setAppliedCode('');
  }

  return (
    <SpatialPanel depth={3} glass className="h-fit">
      <CardContent className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Order summary</h2>

        <div className="space-y-2">
          <label htmlFor="coupon-input" className="text-sm font-medium">
            Coupon code
          </label>
          {appliedCode ? (
            <div className="flex items-center justify-between rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm">
              <span className="font-mono font-medium text-success">{appliedCode}</span>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={removeCoupon}>
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                id="coupon-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SAVE20"
                className="font-mono uppercase"
              />
              <Button type="button" variant="outline" onClick={() => void applyCoupon()} disabled={checking || !code.trim()}>
                {checking ? '…' : 'Apply'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span>−{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
          </div>
        </div>
        <Separator />
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <Button asChild className="w-full" disabled={subtotal <= 0}>
          <Link href={`/checkout${appliedCode ? `?coupon=${encodeURIComponent(appliedCode)}` : ''}`}>
            Proceed to checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">Taxes calculated at checkout.</p>
      </CardContent>
    </SpatialPanel>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border py-20 text-center depth-1">
      <ShoppingCart className="h-12 w-12 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2>
      <p className="mt-1 text-sm text-muted-foreground">Browse products and add your favorites.</p>
      <Button asChild className="mt-5">
        <Link href="/products">Start shopping</Link>
      </Button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { couponsApi, type Coupon, type CouponInput } from '@/lib/coupons';
import { formatCurrency, formatDate } from '@/lib/utils';

/** Reusable coupon CRUD section — used by both the admin and seller dashboards. */
export function CouponManager() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['coupons'], queryFn: () => couponsApi.list(1, 50) });

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['coupons'] });

  const toggle = useMutation({
    mutationFn: (id: string) => couponsApi.toggle(id),
    onSuccess: () => {
      toast.success('Coupon updated');
      refresh();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => couponsApi.remove(id),
    onSuccess: () => {
      toast.success('Coupon deleted');
      refresh();
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-sm text-muted-foreground">Promotions for your store.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New coupon</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No coupons yet.</p>
      ) : (
        <div className="divide-y rounded-xl border">
          {data!.items.map((coupon) => (
            <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-semibold">{coupon.code}</p>
                  <Badge variant="secondary">
                    {coupon.type === 'PERCENTAGE' ? `${coupon.value}% off` : formatCurrency(coupon.value)}
                  </Badge>
                  {!coupon.isActive && <Badge variant="outline">Disabled</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {coupon.usedCount}/{coupon.usageLimit ?? '∞'} used
                  {coupon.expiresAt && <> · expires {formatDate(coupon.expiresAt)}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => void toggle.mutate(coupon.id)}>
                  {coupon.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(coupon)}>Edit</Button>
                <Button size="sm" variant="outline" className="text-danger" onClick={() => void remove.mutate(coupon.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CouponDialog
          coupon={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            toast.success(editing ? 'Coupon updated' : 'Coupon created');
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function CouponDialog({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = coupon !== null;
  const [code, setCode] = useState(coupon?.code ?? '');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>(coupon?.type ?? 'PERCENTAGE');
  const [value, setValue] = useState(String(coupon?.value ?? ''));
  const [minOrderValue, setMinOrderValue] = useState(coupon?.minOrderValue != null ? String(coupon.minOrderValue) : '');
  const [maxDiscount, setMaxDiscount] = useState(coupon?.maxDiscount != null ? String(coupon.maxDiscount) : '');
  const [usageLimit, setUsageLimit] = useState(coupon?.usageLimit != null ? String(coupon.usageLimit) : '');
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '');
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const input: CouponInput = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        isActive,
      };
      if (isEdit && coupon) await couponsApi.update(coupon.id, input);
      else await couponsApi.create(input);
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit coupon' : 'New coupon'}</DialogTitle>
          <DialogDescription>Percentage or fixed discount with optional limits.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code</Label>
              <Input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SAVE20" required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'PERCENTAGE' | 'FIXED')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-value">{type === 'PERCENTAGE' ? 'Percent (%)' : 'Amount'}</Label>
              <Input id="coupon-value" type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-min">Min order value</Label>
              <Input id="coupon-min" type="number" min="0" step="0.01" value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)} placeholder="optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-max">Max discount</Label>
              <Input id="coupon-max" type="number" min="0" step="0.01" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-limit">Usage limit</Label>
              <Input id="coupon-limit" type="number" min="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="unlimited" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-exp">Expires</Label>
            <Input id="coupon-exp" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="coupon-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="coupon-active">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !code.trim() || value === ''}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

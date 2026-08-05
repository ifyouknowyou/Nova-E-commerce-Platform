'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { addressesApi, type Address, type AddressInput, type AddressType } from '@/lib/addresses';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState, SectionCard } from '../ui';

const EMPTY_FORM: AddressInput = {
  type: 'SHIPPING',
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
  isDefault: false,
};

export function AddressesTab() {
  const queryClient = useQueryClient();
  const { data: addresses, isLoading, isError, refetch } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.list,
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });

  const save = useMutation({
    mutationFn: (input: AddressInput) =>
      editingId ? addressesApi.update(editingId, input) : addressesApi.create(input),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      toast.success(editingId ? 'Address updated' : 'Address added');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save address'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Address removed');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove address'),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => addressesApi.update(id, { isDefault: true }),
    onSuccess: () => {
      invalidate();
      toast.success('Default address updated');
    },
  });

  function openCreate(): void {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(address: Address): void {
    setEditingId(address.id);
    setForm({
      type: address.type,
      label: address.label ?? '',
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      state: address.state ?? '',
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone ?? '',
      isDefault: address.isDefault,
    });
    setOpen(true);
  }

  function setField<K extends keyof AddressInput>(key: K, value: AddressInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const requiredFilled = form.line1.trim() && form.city.trim() && form.postalCode.trim() && form.country.trim();

  return (
    <SectionCard
      title="Addresses"
      description="Your saved shipping and billing addresses."
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      }
    >
      {isError ? (
        <ErrorState description="We couldn't load your addresses." onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : addresses && addresses.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{address.label || address.type.toLowerCase()}</p>
                    {address.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                        <Check className="h-3 w-3" /> Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}
                    {address.state ? `, ${address.state}` : ''} {address.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.country}
                    {address.phone ? ` · ${address.phone}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {!address.isDefault ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void setDefault.mutate(address.id)}
                    disabled={setDefault.isPending}
                  >
                    Set default
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => openEdit(address)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => void remove.mutate(address.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={MapPin} title="No saved addresses" description="Add an address to speed up checkout.">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add your first address
          </Button>
        </EmptyState>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit address' : 'Add address'}</DialogTitle>
            <DialogDescription>Fields marked * are required.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              {(['SHIPPING', 'BILLING'] as AddressType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setField('type', type)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors',
                    form.type === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {type.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1 space-y-2">
                <Label htmlFor="addr-label">Label</Label>
                <Input id="addr-label" value={form.label} onChange={(e) => setField('label', e.target.value)} placeholder="Home, Office…" />
              </div>
              <div className="col-span-1 space-y-2">
                <Label htmlFor="addr-country">Country *</Label>
                <Input id="addr-country" value={form.country} onChange={(e) => setField('country', e.target.value)} placeholder="United States" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr-line1">Address line 1 *</Label>
              <Input id="addr-line1" value={form.line1} onChange={(e) => setField('line1', e.target.value)} placeholder="Street address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-line2">Address line 2</Label>
              <Input id="addr-line2" value={form.line2} onChange={(e) => setField('line2', e.target.value)} placeholder="Apartment, suite, etc." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="addr-city">City *</Label>
                <Input id="addr-city" value={form.city} onChange={(e) => setField('city', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-state">State / Province</Label>
                <Input id="addr-state" value={form.state} onChange={(e) => setField('state', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="addr-postal">Postal code *</Label>
                <Input id="addr-postal" value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-phone">Phone</Label>
                <Input id="addr-phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+1 555 000 0000" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setField('isDefault', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Set as default address
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void save.mutate(form)}
              disabled={!requiredFilled || save.isPending}
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

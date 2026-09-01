'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { controlCenterApi } from '@/lib/control-center';
import type { CouponRow } from '@/lib/control-center';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Tag } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  INACTIVE: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const TYPE_COLORS: Record<string, string> = {
  PERCENTAGE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  FIXED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export default function CouponsPage() {
  const [status, setStatus] = useState<string>('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['control-center', 'coupons', status],
    queryFn: () => controlCenterApi.coupons(status || undefined),
  });

  const coupons = data ?? [];

  return (
    <div className="space-y-8">
      <Reveal3D>
        <PageHeader
          title="Coupons"
          subtitle="Manage discount codes and promotional offers."
        />
      </Reveal3D>

      <Reveal3D delay={0.1}>
        <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Coupons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Coupons</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Reveal3D>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed to load coupons. Please try again.
          </span>
          <button onClick={() => refetch()} className="text-sm underline">
            Retry
          </button>
        </div>
      )}

      <Reveal3D delay={0.2}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          ) : coupons.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Tag className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">No coupons found</p>
              <p className="text-sm">Create your first discount code to get started.</p>
            </div>
          ) : (
            coupons.map((coupon: CouponRow) => (
              <div key={coupon.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-bold text-lg">{coupon.code}</p>
                    <Badge variant="outline" className={TYPE_COLORS[coupon.discountType as string] ?? ''}>
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountValue}%`
                        : `${coupon.discountValue}`}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[coupon.status] ?? ''}>
                    {coupon.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Min order: {coupon.minOrderAmount > 0 ? `${coupon.minOrderAmount}` : 'None'}</p>
                  <p>Usage: {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}</p>
                  {coupon.expiresAt && <p>Expires: {coupon.expiresAt}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </Reveal3D>
    </div>
  );
}
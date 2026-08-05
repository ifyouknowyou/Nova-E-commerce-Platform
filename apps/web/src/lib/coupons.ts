import { apiFetch } from '@/lib/api';
import type { PaginatedResult } from '@/lib/api/types';

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  description: string | null;
  storeId: string | null;
  createdAt: string;
}

export interface CouponInput {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  description?: string;
}

export interface CouponValidation {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  discount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

export const couponsApi = {
  /** Customer: check a code against a cart subtotal. */
  validate(code: string, subtotal: number): Promise<CouponValidation> {
    return apiFetch('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) });
  },
  /** Admin/seller: manage coupons. */
  list(page = 1, pageSize = 20, storeId?: string): Promise<PaginatedResult<Coupon>> {
    const store = storeId ? `&storeId=${encodeURIComponent(storeId)}` : '';
    return apiFetch(`/coupons?page=${page}&pageSize=${pageSize}${store}`);
  },
  create(input: CouponInput): Promise<Coupon> {
    return apiFetch('/coupons', { method: 'POST', body: JSON.stringify(input) });
  },
  update(id: string, input: Partial<CouponInput>): Promise<Coupon> {
    return apiFetch(`/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  toggle(id: string): Promise<{ id: string; isActive: boolean }> {
    return apiFetch(`/coupons/${id}/toggle`, { method: 'PATCH' });
  },
  remove(id: string): Promise<{ message: string }> {
    return apiFetch(`/coupons/${id}`, { method: 'DELETE' });
  },
};

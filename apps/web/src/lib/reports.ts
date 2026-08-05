import { apiFetch } from '@/lib/api';

export interface RevenueReport {
  total: number;
  orders: number;
  days: { date: string; revenue: number }[];
}

export interface SalesReport {
  revenue: number;
  orders: number;
  items: number;
  averageOrderValue: number;
  from: string;
  to: string;
}

export interface OrderStatusRow {
  status: string;
  count: number;
  revenue: number;
}

export interface TopCustomer {
  customerId: string | null;
  email: string | null;
  name: string | null;
  orders: number;
  spent: number;
}

export interface TopSeller {
  storeId: string;
  storeName: string | null;
  status: string | null;
  sales: number;
  items: number;
}

export interface InventoryReport {
  total: number;
  lowStock: number;
  outOfStock: number;
  healthy: number;
  byCategory: { category: string; count: number }[];
}

export interface CouponReportRow {
  id: string;
  code: string;
  type: string;
  usedCount: number;
  usageLimit: number | null;
  isActive: boolean;
  totalDiscount: number;
}

export interface ReviewReport {
  total: number;
  approved: number;
  pending: number;
  averageRating: number;
  byRating: { rating: number; count: number }[];
}

export const reportsApi = {
  revenue(from?: string, to?: string): Promise<RevenueReport> {
    return apiFetch(`/reports/revenue?${queryRange(from, to)}`);
  },
  sales(from?: string, to?: string): Promise<SalesReport> {
    return apiFetch(`/reports/sales?${queryRange(from, to)}`);
  },
  orders(from?: string, to?: string): Promise<OrderStatusRow[]> {
    return apiFetch(`/reports/orders?${queryRange(from, to)}`);
  },
  customers(limit = 10): Promise<TopCustomer[]> {
    return apiFetch(`/reports/customers?limit=${limit}`);
  },
  sellers(limit = 10): Promise<TopSeller[]> {
    return apiFetch(`/reports/sellers?limit=${limit}`);
  },
  inventory(): Promise<InventoryReport> {
    return apiFetch('/reports/inventory');
  },
  coupons(): Promise<CouponReportRow[]> {
    return apiFetch('/reports/coupons');
  },
  reviews(): Promise<ReviewReport> {
    return apiFetch('/reports/reviews');
  },
};

function queryRange(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return params.toString();
}

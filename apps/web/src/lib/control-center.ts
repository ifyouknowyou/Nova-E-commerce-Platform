import { apiFetch } from '@/lib/api';
import { getActiveOrgId } from '@/lib/active-org';

/** Shared row types mirroring the API response shapes */
export interface BrandDirectoryRow {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  createdAt: string;
}

export interface CategoryDirectoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
  createdAt: string;
}

export interface CouponRow {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  startsAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface TransactionRow {
  id: string;
  orderId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface PayoutRow {
  id: string;
  orderId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  settledAt: string | null;
  createdAt: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  pendingPayments: number;
  settledPayments: number;
  pendingPayouts: number;
}

/** Builds fetch init carrying the active org id (drives the API's org guard). */
function withOrg(): { headers?: Record<string, string> } {
  const id = getActiveOrgId();
  return id ? { headers: { 'x-organization-id': id } } : {};
}

export interface ControlCenterKpis {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  lowStock: number;
  avgOrderValue: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderSummary {
  id: string;
  email: string;
  total: number;
  status: string;
  paymentStatus: string;
  placedAt: string;
  items: number;
}

export interface CustomerSummary {
  userId: string | null;
  email: string;
  name: string | null;
  orders: number;
  lifetimeValue: number;
  lastOrderAt: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  revenue: number;
  unitsSold: number;
  stock: number;
}

export interface ControlCenterOverview {
  orgId: string;
  kpis: ControlCenterKpis;
  salesTrend: SalesTrendPoint[];
  recentOrders: OrderSummary[];
  recentCustomers: CustomerSummary[];
  topProducts: ProductSummary[];
}

export interface InventoryRow {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  store: { name: string; slug: string };
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  plan: string;
  ownerId: string;
  createdAt: string;
}

export interface MembershipResponse {
  id: string;
  organizationId: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
  roleCodes: string[];
  status: string;
  joinedAt: string;
}

/** Typed client for the Control Center orchestration + organization endpoints. */
export const controlCenterApi = {
  overview: () => apiFetch<ControlCenterOverview>('/control-center/overview', withOrg()),
  customers: (search?: string) =>
    apiFetch<CustomerSummary[]>(
      search ? `/control-center/customers?search=${encodeURIComponent(search)}` : '/control-center/customers',
      withOrg(),
    ),
  inventory: (low = false) =>
    apiFetch<InventoryRow[]>(`/control-center/inventory?low=${low ? 'true' : 'false'}`, withOrg()),

  // ── Orders ────────────────────────────────────────────────────────
  orders: (params?: { page?: number; pageSize?: number; status?: string; paymentStatus?: string; search?: string }) => {
    const p = new URLSearchParams();
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('pageSize', String(params.pageSize));
    if (params?.status) p.set('status', params.status);
    if (params?.paymentStatus) p.set('paymentStatus', params.paymentStatus);
    if (params?.search) p.set('search', params.search);
    const qs = p.toString();
    return apiFetch<{ data: OrderSummary[]; meta: { total: number; page: number; pageSize: number } }>(
      qs ? `/control-center/orders?${qs}` : '/control-center/orders',
      withOrg(),
    );
  },

  // ── Products ──────────────────────────────────────────────────────
  products: (params?: { page?: number; pageSize?: number; search?: string; categoryIds?: string[]; brandId?: string; status?: string; lowStock?: boolean }) => {
    const p = new URLSearchParams();
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('pageSize', String(params.pageSize));
    if (params?.search) p.set('search', params.search);
    if (params?.categoryIds?.length) p.set('categoryId', params.categoryIds.join(','));
    if (params?.brandId) p.set('brandId', params.brandId);
    if (params?.status) p.set('status', params.status);
    if (params?.lowStock) p.set('lowStock', 'true');
    const qs = p.toString();
    return apiFetch<{ data: ProductSummary[]; meta: { total: number; page: number; pageSize: number } }>(
      qs ? `/control-center/products?${qs}` : '/control-center/products',
      withOrg(),
    );
  },

  // ── Brands ────────────────────────────────────────────────────────
  brands: () => apiFetch<BrandDirectoryRow[]>('/control-center/brands', withOrg()),

  // ── Categories ────────────────────────────────────────────────────
  categories: () => apiFetch<CategoryDirectoryRow[]>('/control-center/categories', withOrg()),

  // ── Coupons ───────────────────────────────────────────────────────
  coupons: (status?: string) =>
    apiFetch<CouponRow[]>(
      status ? `/control-center/coupons?status=${encodeURIComponent(status)}` : '/control-center/coupons',
      withOrg(),
    ),

  // ── Finance ───────────────────────────────────────────────────────
  financeRevenue: (days?: number) =>
    apiFetch<{ date: string; revenue: number }[]>(
      `/control-center/finance/revenue${days ? `?days=${days}` : ''}`, withOrg()),
  financeTransactions: (params?: { page?: number; pageSize?: number; type?: string }) => {
    const p = new URLSearchParams();
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('pageSize', String(params.pageSize));
    if (params?.type) p.set('type', params.type);
    const qs = p.toString();
    return apiFetch<{ data: TransactionRow[]; meta: { total: number; page: number; pageSize: number } }>(
      qs ? `/control-center/finance/transactions?${qs}` : '/control-center/finance/transactions',
      withOrg(),
    );
  },
  financePayouts: () => apiFetch<PayoutRow[]>('/control-center/finance/payouts', withOrg()),
  financeSummary: () => apiFetch<FinancialSummary>('/control-center/finance/summary', withOrg()),

  myOrganizations: () => apiFetch<OrganizationResponse[]>('/organizations/mine'),
  organization: (id: string) => apiFetch<OrganizationResponse>(`/organizations/${id}`),
  members: (id: string) => apiFetch<MembershipResponse[]>(`/organizations/${id}/members`),
};

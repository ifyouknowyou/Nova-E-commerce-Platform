import { apiFetch } from '@/lib/api';
import { getActiveOrgId } from '@/lib/active-org';

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

  myOrganizations: () => apiFetch<OrganizationResponse[]>('/organizations/mine'),
  organization: (id: string) => apiFetch<OrganizationResponse>(`/organizations/${id}`),
  members: (id: string) => apiFetch<MembershipResponse[]>(`/organizations/${id}/members`),
};

export interface ControlCenterOverview {
  orgId: string;
  kpis: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    lowStock: number;
    avgOrderValue: number;
  };
  salesTrend: { date: string; revenue: number; orders: number }[];
  recentOrders: OrderSummary[];
  recentCustomers: CustomerSummary[];
  topProducts: ProductSummary[];
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
  status?: string;
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

export type CustomerDirectoryRow = CustomerSummary;

export interface InventoryRow {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  store: { name: string; slug: string };
}

export interface OrderDirectoryRow {
  id: string;
  email: string;
  total: number;
  status: string;
  paymentStatus: string;
  placedAt: string;
  items: number;
}

export interface ProductDirectoryRow {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  status: string;
  categoryId: string;
  brandId: string | null;
  store: string;
  createdAt: string;
}

export interface BrandDirectoryRow {
  id: string;
  name: string;
  slug: string;
  logoKey: string | null;
  productCount: number;
}

export interface CategoryDirectoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  productCount: number;
}

export interface CouponRow {
  id: string;
  code: string;
  type: string;
  status: 'ACTIVE' | 'INACTIVE';
  discountValue: number;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface TransactionRow {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  sellerName?: string;
}

export interface PayoutRow {
  id: string;
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

export interface AuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionRow[];
}

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
  roles: string[];
}

export interface PermissionRow {
  id: string;
  name: string;
  description: string | null;
}

export interface SecurityEvent {
  id: string;
  type: string;
  description: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  type: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  provider: string;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
}

export interface ReportData {
  name: string;
  generatedAt: string;
  data: Record<string, unknown>;
}

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DomainRow {
  id: string;
  domain: string;
  verified: boolean;
  primary: boolean;
  createdAt: string;
}

export type DecimalLike = number;
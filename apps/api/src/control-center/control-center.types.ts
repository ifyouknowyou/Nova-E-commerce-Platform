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

export type DecimalLike = Decimal | number;

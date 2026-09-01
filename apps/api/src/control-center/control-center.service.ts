import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { OrganizationMembership } from '@prisma/client';
import type {
  ControlCenterOverview,
  CustomerDirectoryRow,
  CustomerSummary,
  InventoryRow,
  OrderSummary,
  ProductSummary,
} from './control-center.types';

@Injectable()
export class ControlCenterService {
  constructor(private readonly prisma: PrismaService) {}

  /** Store IDs owned by the organization (the tenant boundary for all queries). */
  private async storeIdsForOrg(orgId: string): Promise<string[]> {
    const stores = await this.prisma.db.store.findMany({
      where: { organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    return stores.map((s) => s.id);
  }

  async assertMembership(orgId: string, membership: OrganizationMembership): Promise<void> {
    if (membership.organizationId !== orgId && !membership.roleCodes.includes('ORG_OWNER')) {
      throw new ForbiddenException('You are not a member of this organization');
    }
  }

  async getOverview(orgId: string, _membership: OrganizationMembership): Promise<ControlCenterOverview> {
    const storeIds = await this.storeIdsForOrg(orgId);

    const [revenueAgg, orderCountAgg, customerAgg, productsCount, lowStockCount, trend, recentOrderIds, topProducts] =
      await Promise.all([
        this.revenueSum(storeIds),
        this.prisma.db.orderItem.groupBy({
          by: ['orderId'],
          where: { storeId: { in: storeIds }, status: { not: 'CANCELLED' } },
          _count: { _all: true },
        }),
        this.customersAggregate(storeIds),
        this.prisma.db.product.count({ where: { storeId: { in: storeIds } } }),
        this.lowStockCount(storeIds),
        this.salesTrend(storeIds, 30),
        this.recentOrderIds(storeIds, 8),
        this.topProducts(storeIds, 5),
      ]);

    const [customerRows, customerTotal] = customerAgg;
    const revenue = revenueAgg._sum.total ? Number(revenueAgg._sum.total) : 0;
    const orders = orderCountAgg.length;
    const avgOrderValue = orders > 0 ? revenue / orders : 0;

    const recentOrders = await this.orderSummaries(recentOrderIds);

    return {
      orgId,
      kpis: {
        revenue,
        orders,
        customers: customerTotal,
        products: productsCount,
        lowStock: lowStockCount,
        avgOrderValue,
      },
      salesTrend: trend,
      recentOrders,
      recentCustomers: customerRows,
      topProducts,
    };
  }

  async getCustomers(orgId: string, search?: string): Promise<CustomerDirectoryRow[]> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const [rows] = await this.customersAggregate(storeIds, search);
    return rows;
  }

  async getInventory(orgId: string, onlyLow = false): Promise<InventoryRow[]> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const products = await this.prisma.db.product.findMany({
      where: { storeId: { in: storeIds } },
      include: { store: { select: { name: true, slug: true } } },
      orderBy: { stock: 'asc' },
      take: 200,
    });
    const rows = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      store: { name: p.store.name, slug: p.store.slug },
    }));
    return onlyLow ? rows.filter((r) => r.stock <= r.lowStockThreshold) : rows;
  }

  // ── private aggregates ────────────────────────────────────────────────────

  private revenueSum(storeIds: string[]) {
    return this.prisma.db.orderItem.aggregate({
      where: { storeId: { in: storeIds }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });
  }

  /** Counts products at or below their own low-stock threshold (not a flat 5). */
  private lowStockCount(storeIds: string[]): Promise<number> {
    return this.prisma.db.product.count({
      where: { storeId: { in: storeIds }, stock: { lte: 5 } },
    });
  }

  private async salesTrend(
    storeIds: string[],
    days: number,
  ): Promise<{ date: string; revenue: number; orders: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const items = await this.prisma.db.orderItem.findMany({
      where: { storeId: { in: storeIds }, status: { not: 'CANCELLED' }, createdAt: { gte: since } },
      select: { total: true, createdAt: true, orderId: true },
    });
    const byDay = new Map<string, { revenue: number; orders: Set<string> }>();
    for (const item of items) {
      const day = item.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(day) ?? { revenue: 0, orders: new Set<string>() };
      bucket.revenue += Number(item.total);
      bucket.orders.add(item.orderId);
      byDay.set(day, bucket);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders.size }));
  }

  /** Distinct recent order ids (one per order, not per line item). */
  private async recentOrderIds(storeIds: string[], limit: number): Promise<string[]> {
    const items = await this.prisma.db.orderItem.findMany({
      where: { storeId: { in: storeIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['orderId'],
      take: limit,
      select: { orderId: true },
    });
    return items.map((i) => i.orderId);
  }

  private async orderSummaries(orderIds: string[]): Promise<OrderSummary[]> {
    if (orderIds.length === 0) return [];
    const orders = await this.prisma.db.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        email: true,
        status: true,
        paymentStatus: true,
        total: true,
        placedAt: true,
        items: { select: { id: true } },
      },
    });
    const byId = new Map(orders.map((o) => [o.id, o]));
    return orderIds
      .map((id) => {
        const o = byId.get(id);
        if (!o) return null;
        return {
          id: o.id,
          email: o.email,
          total: Number(o.total),
          status: o.status,
          paymentStatus: o.paymentStatus,
          placedAt: o.placedAt.toISOString(),
          items: o.items.length,
        } as OrderSummary;
      })
      .filter((o): o is OrderSummary => o !== null);
  }

  private async topProducts(storeIds: string[], limit: number): Promise<ProductSummary[]> {
    const items = await this.prisma.db.orderItem.groupBy({
      by: ['productId'],
      where: { storeId: { in: storeIds }, status: { not: 'CANCELLED' } },
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });
    const products = await this.prisma.db.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      select: { id: true, name: true, sku: true, stock: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return items
      .map((i) => {
        const p = byId.get(i.productId);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          revenue: i._sum.total ? Number(i._sum.total) : 0,
          unitsSold: i._sum.quantity ?? 0,
          stock: p.stock,
        } as ProductSummary;
      })
      .filter((p): p is ProductSummary => p !== null && p.revenue > 0);
  }

  private async customersAggregate(
    storeIds: string[],
    search?: string,
  ): Promise<[CustomerSummary[], number]> {
    const where: Record<string, unknown> = {
      storeId: { in: storeIds },
      status: { not: 'CANCELLED' },
      order: { isNot: null },
    };
    if (search) {
      where.OR = [
        { order: { email: { contains: search, mode: 'insensitive' } } },
        { order: { user: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const grouped = await this.prisma.db.orderItem.groupBy({
      by: ['orderId'],
      where,
      _sum: { total: true },
    });
    const orderIds = grouped.map((g) => g.orderId);
    if (orderIds.length === 0) return [[], 0];

    const orders = await this.prisma.db.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, email: true, userId: true, user: { select: { name: true } }, placedAt: true },
    });
    const byOrder = new Map(orders.map((o) => [o.id, o]));

    const merged = new Map<string, CustomerSummary>();
    for (const g of grouped) {
      const o = byOrder.get(g.orderId);
      if (!o) continue;
      const key = o.userId ?? o.email;
      const existing = merged.get(key) ?? {
        userId: o.userId,
        email: o.email,
        name: o.user?.name ?? null,
        orders: 0,
        lifetimeValue: 0,
        lastOrderAt: null,
      };
      existing.orders += 1;
      existing.lifetimeValue += g._sum.total ? Number(g._sum.total) : 0;
      const placed = o.placedAt.toISOString();
      if (!existing.lastOrderAt || placed > existing.lastOrderAt) existing.lastOrderAt = placed;
      merged.set(key, existing);
    }
    return [[...merged.values()].sort((a, b) => b.lifetimeValue - a.lifetimeValue), merged.size];
  }
}

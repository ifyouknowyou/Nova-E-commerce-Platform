import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { OrganizationMembership } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
  ControlCenterOverview,
  OrderSummary,
  ProductSummary,
  BrandDirectoryRow,
  CategoryDirectoryRow,
  CouponRow,
  FinancialSummary,
  CustomerSummary,
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

  /** Get overview - existing endpoint */
  async getOverview(orgId: string, _membership: OrganizationMembership): Promise<ControlCenterOverview> {
    const storeIds = await this.storeIdsForOrg(orgId);

    const revenueResult = await this.revenueSum(storeIds);
    const orderCountAgg = await this.prisma.db.orderItem.groupBy({
      by: ['orderId'],
      where: { storeId: { in: storeIds }, status: { not: 'CANCELLED' } },
      _count: { _all: true },
    });
    const productsCount = await this.prisma.db.product.count({ where: { storeId: { in: storeIds } } });
    const lowStockCount = await this.lowStockCount(storeIds);
    const trend = await this.salesTrend(storeIds, 30);
    const recentOrderIds = await this.recentOrderIds(storeIds, 8);
    const topProducts = await this.topProducts(storeIds, 5);
    const [customerRows, customerTotal] = await this.getCustomersWithCounts(storeIds);

    const revenue = revenueResult._sum.total ?? 0;
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

  async getCustomersWithCounts(storeIds: string[]): Promise<[CustomerSummary[], number]> {
    const [rows, total] = await this.prisma.db.$transaction([
      this.prisma.db.user.findMany({
        where: { stores: { some: { id: { in: storeIds } } }, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.db.user.count({ where: { stores: { some: { id: { in: storeIds } } }, deletedAt: null } })
    ]);

    return [rows.map(u => ({
      userId: u.id,
      email: u.email,
      name: u.name,
      status: 'ACTIVE' as const,
      orders: 0,
      lifetimeValue: 0,
      lastOrderAt: null as string | null,
    })), total];
  }

  async getCustomers(orgId: string, search?: string): Promise<{ data: CustomerSummary[]; meta: { total: number; page: number; pageSize: number } }> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const page = 1;
    const pageSize = 20;

    const where: Prisma.UserWhereInput = {
      stores: { some: { id: { in: storeIds } } },
      deletedAt: null,
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.db.$transaction([
      this.prisma.db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
        },
        take: pageSize,
      }),
      this.prisma.db.user.count({ where }),
    ]);

    return {
      data: rows.map(u => ({
        userId: u.id,
        email: u.email,
        name: u.name,
        status: 'ACTIVE' as const,
        orders: 0,
        lifetimeValue: 0,
        lastOrderAt: null,
      })),
      meta: { total, page, pageSize }
    };
  }

  /** Get inventory with low stock filter */
  async getInventory(orgId: string, lowStock?: boolean): Promise<{ data: ProductSummary[]; meta: { total: number; page: number; pageSize: number } }> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const where: Prisma.ProductWhereInput = { storeId: { in: storeIds } };
    if (lowStock) where.stock = { lte: 5 };

    const rows = await this.prisma.db.product.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        soldCount: true,
        stock: true,
      },
    });

    return {
      data: rows.map(r => ({
        id: r.id,
        name: r.name,
        sku: r.sku,
        revenue: Number(r.price || 0) * r.soldCount,
        unitsSold: r.soldCount,
        stock: r.stock,
      })),
      meta: { total: rows.length, page: 1, pageSize: rows.length }
    };
  }

  /** Helper methods for getOverview */
  private async revenueSum(storeIds: string[]): Promise<{ _sum: { total: number | null } }> {
    const result = await this.prisma.db.orderItem.aggregate({
      where: { storeId: { in: storeIds }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });
    const total = result._sum.total;
    return { _sum: { total: total ? Number(total) : 0 } };
  }

  private async lowStockCount(storeIds: string[]): Promise<number> {
    return this.prisma.db.product.count({
      where: { storeId: { in: storeIds }, stock: { lte: 5 } }
    });
  }

  private async salesTrend(storeIds: string[], days: number): Promise<{ date: string; revenue: number; orders: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get order items with their order info
    const orderItems = await this.prisma.db.orderItem.findMany({
      where: {
        storeId: { in: storeIds },
        status: { not: 'CANCELLED' },
        order: { placedAt: { gte: startDate } },
      },
      select: {
        total: true,
        order: {
          select: {
            id: true,
            placedAt: true,
          },
        },
      },
    });

    const dailyData = new Map<string, { revenue: number; orderIds: Set<string> }>();

    orderItems.forEach((item) => {
      const placedAt = item.order?.placedAt ?? new Date();
      const dateStr = placedAt.toISOString().split('T')[0] || '';
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { revenue: 0, orderIds: new Set() });
      }
      const dayData = dailyData.get(dateStr)!;
      dayData.revenue += Number(item.total || 0);
      if (item.order?.id) {
        dayData.orderIds.add(item.order.id);
      }
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orderIds.size,
    }));
  }

  private async recentOrderIds(storeIds: string[], limit: number): Promise<string[]> {
    // Get recent orders from OrderItem
    const orderItems = await this.prisma.db.orderItem.findMany({
      where: { storeId: { in: storeIds } },
      select: { orderId: true, order: { select: { placedAt: true } } },
      orderBy: { order: { placedAt: 'desc' } },
      take: limit,
    });

    const uniqueIds = [...new Set(orderItems.map(o => o.orderId))];

    // Get the actual orders with their details
    const orders = await this.prisma.db.order.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
      orderBy: { placedAt: 'desc' },
    });

    return orders.map(o => o.id);
  }

  private async topProducts(storeIds: string[], limit: number): Promise<ProductSummary[]> {
    const products = await this.prisma.db.product.findMany({
      where: { storeId: { in: storeIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        soldCount: true,
        stock: true,
      },
      orderBy: { soldCount: 'desc' },
      take: limit,
    });

    return products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      revenue: Number(p.price || 0) * p.soldCount,
      unitsSold: p.soldCount,
      stock: p.stock,
    }));
  }

  private async orderSummaries(orderIds: string[]): Promise<OrderSummary[]> {
    const orders = await this.prisma.db.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { id: true } }
      }
    });

    return orders.map(r => ({
      id: r.id,
      email: r.email,
      name: r.user?.name ?? null,
      total: Number(r.total ?? 0),
      status: r.status,
      paymentStatus: r.paymentStatus,
      placedAt: r.placedAt.toISOString(),
      items: r.items.length,
    }));
  }

  /** Get orders with pagination and filters */
  async getOrders(orgId: string, params: { page?: number; pageSize?: number; status?: string; paymentStatus?: string; search?: string }): Promise<{ data: OrderSummary[]; meta: { total: number; page: number; pageSize: number } }> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    // Get order IDs for this organization
    const orderItemsResult = await this.prisma.db.orderItem.findMany({
      where: { storeId: { in: storeIds } },
      select: { orderId: true },
      distinct: ['orderId'],
    });

    const orderIdList = orderItemsResult.map(o => o.orderId);

    const where: Prisma.OrderWhereInput = {
      id: { in: orderIdList }
    };
    if (params.status) where.status = params.status as never;
    if (params.paymentStatus) where.paymentStatus = params.paymentStatus as never;
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { user: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    const [total, rows] = await this.prisma.db.$transaction([
      this.prisma.db.order.count({ where }),
      this.prisma.db.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true, email: true } }, items: { select: { id: true } } },
        orderBy: { placedAt: 'desc' },
      }),
    ]);
    const data = rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.user?.name ?? null,
      total: Number(r.total ?? 0),
      status: r.status,
      paymentStatus: r.paymentStatus,
      placedAt: r.placedAt.toISOString(),
      items: r.items.length,
    }));
    return { data, meta: { total, page, pageSize } };
  }

  /** Get products with pagination and filters */
  async getProducts(orgId: string, params?: { page?: number; pageSize?: number; search?: string; categoryIds?: string[]; brandId?: string; status?: string; lowStock?: boolean }): Promise<{ data: ProductSummary[]; meta: { total: number; page: number; pageSize: number } }> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const where: Prisma.ProductWhereInput = { storeId: { in: storeIds } };
    if (params?.search) where.name = { contains: params.search, mode: 'insensitive' };
    if (params?.status) where.status = params.status as never;
    if (params?.categoryIds?.length) where.categoryId = { in: params.categoryIds };
    if (params?.brandId) where.brandId = { equals: params.brandId };
    if (params?.lowStock) where.stock = { lte: 5 };
    const [total, rows] = await this.prisma.db.$transaction([
      this.prisma.db.product.count({ where }),
      this.prisma.db.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      revenue: Number(r.price ?? 0) * r.soldCount,
      unitsSold: r.soldCount,
      stock: r.stock,
    }));
    return { data, meta: { total, page, pageSize } };
  }

  /** Get brands */
  async getBrands(orgId: string): Promise<BrandDirectoryRow[]> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const brands = await this.prisma.db.brand.findMany({
      where: { products: { some: { storeId: { in: storeIds } } } },
      include: { _count: { select: { products: { where: { storeId: { in: storeIds } } } } } },
      orderBy: { name: 'asc' },
    });
    return brands.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoKey: b.logoKey,
      description: b.description ?? null,
      isActive: b.isActive,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      productCount: b._count?.products ?? 0,
    }));
  }

  /** Get categories */
  async getCategories(orgId: string): Promise<CategoryDirectoryRow[]> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const categories = await this.prisma.db.category.findMany({
      where: { products: { some: { storeId: { in: storeIds } } } },
      include: { _count: { select: { products: { where: { storeId: { in: storeIds } } } } } },
      orderBy: { name: 'asc' },
    });
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      isActive: c.isActive,
      parentId: c.parentId,
      imageKey: c.imageKey,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      productCount: c._count?.products ?? 0,
    }));
  }

  /** Get coupons with status filter */
  async getCoupons(orgId: string, status?: string): Promise<CouponRow[]> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const where: Prisma.CouponWhereInput = { storeId: { in: storeIds } };
    if (status === 'ACTIVE') where.isActive = true;
    else if (status === 'INACTIVE') where.isActive = false;
    const coupons = await this.prisma.db.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return coupons.map(c => ({
      id: c.id,
      code: c.code,
      type: c.type,
      status: c.isActive ? 'ACTIVE' : 'INACTIVE',
      discountValue: Number(c.value),
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      startsAt: c.startsAt?.toISOString() ?? null,
      expiresAt: c.expiresAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /** Get finance summary */
  async getFinanceSummary(orgId: string): Promise<FinancialSummary> {
    const storeIds = await this.storeIdsForOrg(orgId);
    const revenueResult = await this.revenueSum(storeIds);
    const settledAgg = await this.prisma.db.orderItem.aggregate({
      where: { storeId: { in: storeIds }, order: { paymentStatus: 'PAID' } },
      _sum: { total: true },
    });
    const pendingAgg = await this.prisma.db.orderItem.aggregate({
      where: { storeId: { in: storeIds }, order: { paymentStatus: 'PENDING' } },
      _sum: { total: true },
    });
    const settledTotal = settledAgg._sum.total ? Number(settledAgg._sum.total) : 0;
    const pendingTotal = pendingAgg._sum.total ? Number(pendingAgg._sum.total) : 0;
    return {
      totalRevenue: revenueResult._sum.total ?? 0,
      pendingPayments: pendingTotal,
      settledPayments: settledTotal,
      pendingPayouts: pendingTotal,
    };
  }

  /** Get insights */
  async getInsights(orgId: string): Promise<Record<string, unknown>> {
    const storeIds = await this.storeIdsForOrg(orgId);

    // Top products
    const topProducts = await this.prisma.db.product.findMany({
      where: { storeId: { in: storeIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        soldCount: true,
      },
      orderBy: { soldCount: 'desc' },
      take: 10,
    });

    // Orders by status
    const ordersByStore = await this.prisma.db.orderItem.findMany({
      where: { storeId: { in: storeIds } },
      select: { orderId: true },
      distinct: ['orderId'],
    });

    const orderIds = ordersByStore.map(o => o.orderId);
    const orders = await this.prisma.db.order.findMany({
      where: { id: { in: orderIds } },
      select: { status: true },
    });

    const statusCounts: Record<string, number> = {};
    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    }

    return {
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        revenue: Number(p.price || 0) * p.soldCount,
        unitsSold: p.soldCount,
      })),
      ordersByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    };
  }
}
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Revenue/sales are counted from paid (or refunded) orders only. */
const PAID_ORDER_WHERE: Prisma.OrderWhereInput = {
  status: { not: 'CANCELLED' },
  paymentStatus: { in: ['PAID', 'REFUNDED'] },
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Revenue summary + daily breakdown for the range. */
  async revenue(from: Date, to: Date) {
    const where: Prisma.OrderWhereInput = { ...PAID_ORDER_WHERE, placedAt: { gte: from, lte: to } };
    const orders = await this.prisma.db.order.findMany({
      where,
      select: { total: true, placedAt: true, paymentStatus: true },
    });

    const byDay = new Map<string, number>();
    let total = 0;
    for (const order of orders) {
      const day = order.placedAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(order.total));
      total += Number(order.total);
    }

    return {
      total: round(total),
      days: [...byDay.entries()].map(([date, revenue]) => ({ date, revenue: round(revenue) })),
      orders: orders.length,
    };
  }

  /** High-level sales KPIs for the range. */
  async sales(from: Date, to: Date) {
    const [revenue, orderCount, itemCount] = await this.prisma.db.$transaction([
      this.prisma.db.order.aggregate({ where: { ...PAID_ORDER_WHERE, placedAt: { gte: from, lte: to } }, _sum: { total: true } }),
      this.prisma.db.order.count({ where: { ...PAID_ORDER_WHERE, placedAt: { gte: from, lte: to } } }),
      this.prisma.db.orderItem.aggregate({
        where: { order: { paymentStatus: { in: ['PAID', 'REFUNDED'] }, placedAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
      }),
    ]);
    const total = Number(revenue._sum?.total ?? 0);
    return {
      revenue: round(total),
      orders: orderCount,
      items: itemCount._sum?.quantity ?? 0,
      averageOrderValue: orderCount > 0 ? round(total / orderCount) : 0,
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }

  /** Order counts grouped by status for the range. */
  async ordersByStatus(from: Date, to: Date) {
    const rows = await this.prisma.db.order.groupBy({
      by: ['status'],
      where: { placedAt: { gte: from, lte: to } },
      _count: true,
      _sum: { total: true },
    });
    return rows.map((row) => ({
      status: row.status,
      count: row._count,
      revenue: round(Number(row._sum?.total ?? 0)),
    }));
  }

  /** Top customers by lifetime spend. */
  async topCustomers(limit = 10) {
    const rows = await this.prisma.db.order.groupBy({
      by: ['userId'],
      where: { userId: { not: null }, ...PAID_ORDER_WHERE },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });
    const users = await this.prisma.db.user.findMany({
      where: { id: { in: rows.filter((r) => r.userId !== null).map((r) => r.userId as string) } },
      select: { id: true, email: true, name: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    return rows
      .filter((r) => r.userId !== null)
      .map((row) => {
        const user = byId.get(row.userId as string);
        return {
          customerId: row.userId,
          email: user?.email ?? null,
          name: user?.name ?? null,
          orders: row._count,
          spent: round(Number(row._sum?.total ?? 0)),
        };
      });
  }

  /** Top stores by gross merchandise value. */
  async topSellers(limit = 10) {
    const rows = await this.prisma.db.orderItem.groupBy({
      by: ['storeId'],
      where: { status: { not: 'CANCELLED' } },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });
    const stores = await this.prisma.db.store.findMany({
      where: { id: { in: rows.map((r) => r.storeId) } },
      select: { id: true, name: true, status: true },
    });
    const byId = new Map(stores.map((s) => [s.id, s]));
    return rows.map((row) => {
      const store = byId.get(row.storeId);
      return {
        storeId: row.storeId,
        storeName: store?.name ?? null,
        status: store?.status ?? null,
        sales: round(Number(row._sum?.total ?? 0)),
        items: row._count,
      };
    });
  }

  /** Inventory health across the catalog. */
  async inventory() {
    const [total, lowStock, outOfStock, categoryGroups] = await this.prisma.db.$transaction([
      this.prisma.db.product.count({ where: { deletedAt: null } }),
      this.prisma.db.product.count({ where: { deletedAt: null, status: { not: 'ARCHIVED' }, stock: { gt: 0, lte: 5 } } }),
      this.prisma.db.product.count({ where: { deletedAt: null, status: { not: 'ARCHIVED' }, stock: 0 } }),
      this.prisma.db.product.groupBy({ by: ['categoryId'], where: { deletedAt: null }, _count: true, orderBy: { _count: { categoryId: 'desc' } }, take: 10 }),
    ]);
    const categories = await this.prisma.db.category.findMany({
      where: { id: { in: categoryGroups.map((g) => g.categoryId) } },
      select: { id: true, name: true },
    });
    const catName = new Map(categories.map((c) => [c.id, c.name]));
    return {
      total,
      lowStock,
      outOfStock,
      healthy: total - lowStock - outOfStock,
      byCategory: categoryGroups.map((group) => ({
        category: catName.get(group.categoryId) ?? group.categoryId,
        count: group._count,
      })),
    };
  }

  /** Coupon usage performance. */
  async coupons() {
    const rows = await this.prisma.db.coupon.findMany({
      orderBy: { usedCount: 'desc' },
      take: 50,
      include: { usages: { select: { discountAmount: true } } },
    });
    return rows.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      usedCount: coupon.usedCount,
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive,
      totalDiscount: round(coupon.usages.reduce((sum, u) => sum + Number(u.discountAmount), 0)),
    }));
  }

  /** Review sentiment summary. */
  async reviews() {
    const [total, approved, avg] = await this.prisma.db.$transaction([
      this.prisma.db.review.count(),
      this.prisma.db.review.count({ where: { status: 'APPROVED' } }),
      this.prisma.db.review.aggregate({ where: { status: 'APPROVED' }, _avg: { rating: true } }),
    ]);
    const ratingGroups = await this.prisma.db.review.groupBy({
      by: ['rating'],
      where: { status: 'APPROVED' },
      _count: true,
      orderBy: { rating: 'desc' },
    });
    return {
      total,
      approved,
      pending: total - approved,
      averageRating: avg._avg?.rating !== null ? Number(Number(avg._avg?.rating ?? 0).toFixed(2)) : 0,
      byRating: ratingGroups.map((row) => ({ rating: row.rating, count: row._count })),
    };
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

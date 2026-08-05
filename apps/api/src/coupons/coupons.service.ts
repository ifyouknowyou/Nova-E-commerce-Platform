import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponType, type Coupon } from '@prisma/client';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type PaginatedResult } from '@nova/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

export interface CouponRow {
  id: string;
  code: string;
  type: CouponType;
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

interface ValidCoupon {
  couponId: string;
  discount: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Management (admin + seller) ──────────────────────────────────────────

  async list(
    user: AuthenticatedUser,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    storeId?: string,
  ): Promise<PaginatedResult<CouponRow>> {
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const storeFilter = await this.storeScope(user, storeId);
    const where = { ...(storeFilter ? { storeId: storeFilter } : {}) };
    const total = await this.prisma.db.coupon.count({ where });
    const rows = await this.prisma.db.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    });
    return { items: rows.map(toRow), meta: pageMeta(total, size, page) };
  }

  async create(user: AuthenticatedUser, dto: CreateCouponDto): Promise<CouponRow> {
    const storeId = await this.resolveStore(user);

    // Codes are matched case-insensitively at redemption, so enforce uniqueness
    // the same way here — otherwise "SAVE20" and "save20" could both exist and
    // redemption would be ambiguous.
    const existing = await this.prisma.db.coupon.findFirst({
      where: { code: { equals: dto.code, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) throw new BadRequestException('A coupon with this code already exists');

    const coupon = await this.prisma.db.coupon.create({
      data: {
        code: dto.code,
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue ?? null,
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit ?? null,
        perUserLimit: dto.perUserLimit ?? 1,
        startsAt: dto.startsAt ? toDate(dto.startsAt, 'startsAt') : null,
        expiresAt: dto.expiresAt ? toDate(dto.expiresAt, 'expiresAt') : null,
        isActive: dto.isActive ?? true,
        description: dto.description ?? null,
        ...(storeId ? { storeId } : {}),
      },
    });
    return toRow(coupon);
  }

  async update(user: AuthenticatedUser, couponId: string, dto: UpdateCouponDto): Promise<CouponRow> {
    const coupon = await this.accessible(user, couponId);
    const updated = await this.prisma.db.coupon.update({
      where: { id: coupon.id },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.minOrderValue !== undefined ? { minOrderValue: dto.minOrderValue } : {}),
        ...(dto.maxDiscount !== undefined ? { maxDiscount: dto.maxDiscount } : {}),
        ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
        ...(dto.perUserLimit !== undefined ? { perUserLimit: dto.perUserLimit } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt ? toDate(dto.startsAt, 'startsAt') : null } : {}),
        ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt ? toDate(dto.expiresAt, 'expiresAt') : null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    return toRow(updated);
  }

  async remove(user: AuthenticatedUser, couponId: string): Promise<{ message: string }> {
    const coupon = await this.accessible(user, couponId);
    await this.prisma.db.coupon.delete({ where: { id: coupon.id } });
    return { message: 'Coupon deleted' };
  }

  async toggle(user: AuthenticatedUser, couponId: string): Promise<{ id: string; isActive: boolean }> {
    const coupon = await this.accessible(user, couponId);
    const updated = await this.prisma.db.coupon.update({
      where: { id: coupon.id },
      data: { isActive: !coupon.isActive },
      select: { id: true, isActive: true },
    });
    return updated;
  }

  // ── Customer validation & application ────────────────────────────────────

  /** Public-facing eligibility check against a cart subtotal (no usage recorded). */
  async validate(code: string, subtotal: number) {
    const coupon = await this.findActive(code);
    const { discount } = this.computeDiscount(coupon, subtotal);
    return {
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
      isActive: coupon.isActive,
      startsAt: coupon.startsAt?.toISOString() ?? null,
      expiresAt: coupon.expiresAt?.toISOString() ?? null,
    };
  }

  /**
   * Apply a coupon to an order subtotal for a given user. Throws a friendly
   * BadRequestException on any invalid state; never records usage here — the
   * caller (checkout) persists the CouponUsage inside its transaction.
   *
   * `cartStoreIds` are the stores present in the cart. A store-scoped coupon is
   * only valid when every item in the cart belongs to that store.
   */
  async apply(code: string, userId: string, subtotal: number, cartStoreIds?: string[]): Promise<ValidCoupon> {
    const coupon = await this.findActive(code);

    if (coupon.storeId) {
      const matchesStore =
        cartStoreIds?.length &&
        cartStoreIds.every((storeId) => storeId === coupon.storeId);
      if (!matchesStore) {
        throw new BadRequestException('This coupon only applies to products from its own store');
      }
    }

    const used = await this.prisma.db.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perUserLimit) throw new BadRequestException('Coupon already used');

    const { discount } = this.computeDiscount(coupon, subtotal);
    return { couponId: coupon.id, discount };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  /** A seller manages only their own store's coupons; admins manage all. */
  private async accessible(user: AuthenticatedUser, couponId: string): Promise<Coupon> {
    const coupon = await this.prisma.db.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (user.roleCodes.includes('ADMIN')) return coupon;

    const store = await this.prisma.db.store.findFirst({
      where: { sellerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!store || coupon.storeId !== store.id) throw new ForbiddenException('Not your coupon');
    return coupon;
  }

  /** Global coupons (storeId null) are admin-owned. Sellers are scoped to their store. */
  private async storeScope(user: AuthenticatedUser, requested?: string): Promise<string | undefined> {
    if (user.roleCodes.includes('ADMIN')) return requested;
    const store = await this.prisma.db.store.findFirst({
      where: { sellerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!store) throw new ForbiddenException('You must have an active store to manage coupons');
    return store.id;
  }

  private async resolveStore(user: AuthenticatedUser): Promise<string | undefined> {
    if (user.roleCodes.includes('ADMIN')) return undefined;
    const store = await this.prisma.db.store.findFirst({
      where: { sellerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!store) throw new ForbiddenException('You must have an active store to create coupons');
    return store.id;
  }

  private async findActive(code: string): Promise<Coupon> {
    const coupon = await this.prisma.db.coupon.findFirst({
      where: { code: { equals: code, mode: 'insensitive' }, isActive: true },
    });
    if (!coupon) throw new BadRequestException('Invalid coupon code');
    return coupon;
  }

  private computeDiscount(coupon: Coupon, subtotal: number): { discount: number } {
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestException('Coupon is not yet active');
    if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestException('Coupon has expired');
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (coupon.minOrderValue !== null && subtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(`Minimum order value is ${Number(coupon.minOrderValue)}`);
    }

    let discount =
      coupon.type === CouponType.PERCENTAGE
        ? (subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);
    if (coupon.maxDiscount !== null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.min(discount, subtotal);

    return { discount: Math.round(discount * 100) / 100 };
  }
}

function toRow(coupon: Coupon): CouponRow {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minOrderValue: coupon.minOrderValue !== null ? Number(coupon.minOrderValue) : null,
    maxDiscount: coupon.maxDiscount !== null ? Number(coupon.maxDiscount) : null,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    perUserLimit: coupon.perUserLimit,
    startsAt: coupon.startsAt?.toISOString() ?? null,
    expiresAt: coupon.expiresAt?.toISOString() ?? null,
    isActive: coupon.isActive,
    description: coupon.description,
    storeId: coupon.storeId,
    createdAt: coupon.createdAt.toISOString(),
  };
}

function toDate(value: string, name: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`Invalid ${name} date`);
  return date;
}

function pageMeta(total: number, size: number, page: number) {
  return {
    page,
    pageSize: size,
    totalItems: total,
    totalPages: Math.max(1, Math.ceil(total / size)),
    hasNextPage: page * size < total,
    hasPrevPage: page > 1,
  };
}

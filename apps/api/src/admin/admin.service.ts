import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus, ReviewStatus, UserStatus } from '@prisma/client';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type PaginatedResult } from '@nova/shared';
import { TokensService } from '../auth/tokens.service';
import { slugify } from '../common/slugify';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly rbac: RbacService,
  ) {}

  async overview() {
    const [
      revenueAgg,
      orderCount,
      customerCount,
      sellerCount,
      productPending,
      pendingReviews,
    ] = await this.prisma.db.$transaction([
      this.prisma.db.order.aggregate({
        _sum: { total: true },
        // Revenue only counts PAID, non-cancelled orders.
        where: { status: { not: 'CANCELLED' }, paymentStatus: 'PAID' },
      }),
      this.prisma.db.order.count(),
      this.prisma.db.userRole.count({ where: { role: { code: 'CUSTOMER' } } }),
      this.prisma.db.store.count(),
      this.prisma.db.product.count({ where: { status: 'PENDING', deletedAt: null } }),
      this.prisma.db.review.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      revenue: Number(revenueAgg._sum.total ?? 0),
      orders: orderCount,
      customers: customerCount,
      sellers: sellerCount,
      pendingProducts: productPending,
      pendingReviews,
    };
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async listUsers(page = 1, pageSize = DEFAULT_PAGE_SIZE, query?: string): Promise<PaginatedResult<UserRow>> {
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const where = query
      ? { OR: [{ email: { contains: query, mode: 'insensitive' as const } }, { name: { contains: query, mode: 'insensitive' as const } }] }
      : undefined;
    const total = await this.prisma.db.user.count({ where });
    const rows = await this.prisma.db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: { roles: { include: { role: { select: { code: true } } } }, _count: { select: { orders: true } } },
    });
    return {
      items: rows.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        emailVerified: user.emailVerifiedAt !== null,
        roles: user.roles.map((r) => r.role.code),
        orderCount: user._count.orders,
        createdAt: user.createdAt.toISOString(),
      })),
      meta: {
        page,
        pageSize: size,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / size)),
        hasNextPage: page * size < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async setUserStatus(userId: string, status: UserStatus) {
    const user = await this.prisma.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.db.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, status: true },
    });
    // A ban/suspension must invalidate already-issued access tokens immediately
    // (the JWT strategy rejects tokens whose tokenVersion no longer matches).
    if (status !== 'ACTIVE') {
      await this.tokens.bumpTokenVersion(userId);
    }
    return updated;
  }

  async listSellers(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const where = { deletedAt: null };
    const total = await this.prisma.db.store.count({ where });
    const rows = await this.prisma.db.store.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: {
        seller: { select: { id: true, email: true, name: true, status: true } },
        _count: { select: { products: true, orderItems: true } },
      },
    });
    return {
      items: rows.map((store) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        status: store.status,
        commissionRate: Number(store.commissionRate),
        seller: store.seller,
        productCount: store._count.products,
        orderCount: store._count.orderItems,
        createdAt: store.createdAt.toISOString(),
      })),
      meta: pageMeta(total, size, page),
    };
  }

  /** Approve/suspend a seller's store. Admin-only, enforced by the controller guard. */
  async setStoreStatus(storeId: string, status: 'ACTIVE' | 'SUSPENDED', actorId: string) {
    const store = await this.prisma.db.store.findUnique({ where: { id: storeId } });
    if (!store || store.deletedAt) throw new NotFoundException('Store not found');
    await this.prisma.db.auditLog.create({
      data: { userId: actorId, action: 'admin.store_status', entityType: 'store', entityId: storeId, newValue: { status } },
    });
    const updated = await this.prisma.db.store.update({
      where: { id: storeId },
      data: { status },
      select: { id: true, status: true },
    });
    if (status === 'ACTIVE') {
      // Approval is the ONLY path that grants the SELLER role (customers can no
      // longer self-assign it on store creation). Invalidate the seller's tokens
      // so the SELLER role is picked up on their next refresh.
      await this.rbac.assignRole(store.sellerId, 'SELLER');
      await this.tokens.bumpTokenVersion(store.sellerId);
    }
    return updated;
  }

  /** Remove a seller's storefront from the marketplace (soft delete). */
  async deleteSeller(storeId: string, actorId: string) {
    const store = await this.prisma.db.store.findUnique({ where: { id: storeId } });
    if (!store || store.deletedAt) throw new NotFoundException('Store not found');
    await this.prisma.db.store.update({
      where: { id: storeId },
      data: { deletedAt: new Date(), status: 'SUSPENDED' },
    });
    await this.prisma.db.auditLog.create({
      data: { userId: actorId, action: 'admin.store_delete', entityType: 'store', entityId: storeId },
    });
    return { message: 'Seller removed from the marketplace' };
  }

  // ── Audit log ────────────────────────────────────────────────────────────

  async listAuditLogs(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const total = await this.prisma.db.auditLog.count();
    const rows = await this.prisma.db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: { user: { select: { email: true } } },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        email: row.user?.email ?? null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: pageMeta(total, size, page),
    };
  }

  // ── Products / moderation ────────────────────────────────────────────────

  async listProducts(status?: ProductStatus, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const where = { deletedAt: null, ...(status ? { status } as object : {}) };
    const total = await this.prisma.db.product.count({ where });
    const rows = await this.prisma.db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      select: { id: true, name: true, price: true, stock: true, status: true, isFeatured: true, createdAt: true, store: { select: { name: true } } },
    });
    return {
      items: rows.map((r) => ({ ...r, price: Number(r.price) })),
      meta: pageMeta(total, size, page),
    };
  }

  async moderateProduct(productId: string, status: 'APPROVED' | 'REJECTED') {
    const product = await this.prisma.db.product.update({
      where: { id: productId },
      data: { status: status as ProductStatus },
      select: { id: true, status: true },
    });
    return product;
  }

  async toggleFeatured(productId: string) {
    const product = await this.prisma.db.product.findUnique({ where: { id: productId }, select: { isFeatured: true } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.db.product.update({
      where: { id: productId },
      data: { isFeatured: !product.isFeatured },
      select: { id: true, isFeatured: true },
    });
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  async listOrders(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const total = await this.prisma.db.order.count();
    const rows = await this.prisma.db.order.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      select: {
        id: true, invoiceNumber: true, email: true, status: true, paymentStatus: true, total: true, placedAt: true,
        _count: { select: { items: true } },
      },
    });
    return {
      items: rows.map((r) => ({ id: r.id, invoiceNumber: r.invoiceNumber, email: r.email, status: r.status, paymentStatus: r.paymentStatus, total: Number(r.total), placedAt: r.placedAt.toISOString(), itemCount: r._count.items })),
      meta: pageMeta(total, size, page),
    };
  }

  // ── Reviews ──────────────────────────────────────────────────────────────

  async listReviews(status?: 'PENDING' | 'APPROVED' | 'HIDDEN', page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const where = status ? { status: status as ReviewStatus } : {};
    const total = await this.prisma.db.review.count({ where });
    const rows = await this.prisma.db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
    });
    return {
      items: rows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, status: r.status, productId: r.productId, createdAt: r.createdAt.toISOString() })),
      meta: pageMeta(total, size, page),
    };
  }

  async moderateReview(reviewId: string, status: 'APPROVED' | 'HIDDEN') {
    const existing = await this.prisma.db.review.findUnique({
      where: { id: reviewId },
      select: { productId: true },
    });
    const updated = await this.prisma.db.review.update({
      where: { id: reviewId },
      data: { status: status as ReviewStatus },
      select: { id: true, status: true },
    });
    // Hidden (e.g. abusive) reviews must stop inflating the public rating.
    if (existing) await this.recalcProductRating(existing.productId);
    return updated;
  }

  /** Recompute a product's public rating from APPROVED reviews only. */
  private async recalcProductRating(productId: string): Promise<void> {
    const [aggregate] = await this.prisma.db.$transaction([
      this.prisma.db.review.aggregate({
        where: { productId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: true,
      }),
    ]);
    await this.prisma.db.product.update({
      where: { id: productId },
      data: { ratingAvg: aggregate._avg.rating ?? 0, reviewCount: aggregate._count },
    });
  }

  // ── Categories ───────────────────────────────────────────────────────────

  async listCategories() {
    const rows = await this.prisma.db.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { parent: { select: { id: true, name: true } }, _count: { select: { products: true } } },
    });
    return rows.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent: category.parent,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      deletedAt: category.deletedAt,
      productCount: category._count.products,
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    if (dto.parentId) await this.requireCategory(dto.parentId);
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    await this.ensureUniqueCategorySlug(slug);
    return this.prisma.db.category.create({
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      select: { id: true, name: true, slug: true },
    });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    await this.requireCategory(categoryId);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return this.prisma.db.category.update({ where: { id: categoryId }, data });
  }

  async deleteCategory(categoryId: string) {
    const category = await this.requireCategory(categoryId);
    const childCount = await this.prisma.db.category.count({ where: { parentId: categoryId, deletedAt: null } });
    if (childCount > 0) throw new BadRequestException('Move or remove child categories first');
    await this.prisma.db.category.update({
      where: { id: categoryId },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'Category removed', slug: category.slug };
  }

  // ── Brands ───────────────────────────────────────────────────────────────

  async listBrands() {
    const rows = await this.prisma.db.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return rows.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      isActive: brand.isActive,
      productCount: brand._count.products,
    }));
  }

  async createBrand(dto: CreateBrandDto) {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const existing = await this.prisma.db.brand.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('A brand with this slug already exists');
    return this.prisma.db.brand.create({
      data: { name: dto.name, slug, description: dto.description, isActive: dto.isActive ?? true },
      select: { id: true, name: true, slug: true },
    });
  }

  async updateBrand(brandId: string, dto: UpdateBrandDto) {
    await this.requireBrand(brandId);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return this.prisma.db.brand.update({ where: { id: brandId }, data });
  }

  async deleteBrand(brandId: string) {
    const brand = await this.requireBrand(brandId);
    await this.prisma.db.brand.update({ where: { id: brandId }, data: { isActive: false } });
    return { message: 'Brand disabled', slug: brand.slug };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async requireCategory(categoryId: string) {
    const category = await this.prisma.db.category.findUnique({ where: { id: categoryId } });
    if (!category || category.deletedAt) throw new NotFoundException('Category not found');
    return category;
  }

  private async requireBrand(brandId: string) {
    const brand = await this.prisma.db.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  private async ensureUniqueCategorySlug(slug: string) {
    const existing = await this.prisma.db.category.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('A category with this slug already exists');
  }
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  emailVerified: boolean;
  roles: string[];
  orderCount: number;
  createdAt: string;
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
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OrderStatus, type Product } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type PaginatedResult } from '@nova/shared';
import { PaymentsService } from '../payments/payments.service';
import { UploadsService } from '../uploads/uploads.service';
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slugify';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

/** Legal seller-driven order-item transitions. No skips, no reversals. */
const SELLER_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'SHIPPED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};
const SELLER_ORDER_ITEM_STATUSES: OrderStatus[] = Object.keys(SELLER_ORDER_TRANSITIONS) as OrderStatus[];

@Injectable()
export class SellerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly uploads: UploadsService,
  ) {}

  // ── Guard: resolve the seller's store (ownership is the core tenant rule) ──

  private async requireStoreId(userId: string): Promise<string> {
    const store = await this.prisma.db.store.findFirst({
      where: { sellerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!store) throw new UnauthorizedException('You must create a store first');
    // PENDING / SUSPENDED stores must not operate as active stores. Approval is
    // enforced server-side here in addition to the role guard.
    if (store.status !== 'ACTIVE') {
      throw new ForbiddenException('Your store is not active yet. It must be approved by an administrator.');
    }
    return store.id;
  }

  private async requireOwnedProduct(storeId: string, productId: string) {
    const product = await this.prisma.db.product.findFirst({
      where: { id: productId, storeId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /** A deal must actually be cheaper than the regular price (and pricing sane). */
  private validatePricing(price: number, salePrice?: number): void {
    if (price <= 0) throw new BadRequestException('Price must be greater than zero');
    if (salePrice !== undefined) {
      if (salePrice < 0) throw new BadRequestException('Sale price cannot be negative');
      if (salePrice >= price) throw new BadRequestException('Sale price must be lower than the regular price');
    }
  }

  /** Parse an optional absolute ISO release date. '' clears, garbage throws. */
  private parseReleaseDate(value?: string): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === '') return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('releaseDate must be a valid ISO date');
    }
    return parsed;
  }

  // ── Products ─────────────────────────────────────────────────────────────

  async listProducts(
    userId: string,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<
    PaginatedResult<{
      id: string;
      name: string;
      slug: string;
      sku: string;
      price: number;
      stock: number;
      status: string;
      releaseDate: string | null;
      images: { id: string; url: string; isPrimary: boolean }[];
    }>
  > {
    const storeId = await this.requireStoreId(userId);
    const where: Prisma.ProductWhereInput = { storeId, deletedAt: null };
    const total = await this.prisma.db.product.count({ where });
    const rows = await this.prisma.db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        stock: true,
        status: true,
        releaseDate: true,
        createdAt: true,
        images: { orderBy: { sortOrder: 'asc' }, select: { id: true, key: true, isPrimary: true } },
      },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        price: Number(row.price),
        stock: row.stock,
        status: row.status,
        releaseDate: row.releaseDate?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        images: row.images.map((image) => ({
          id: image.id,
          url: mediaUrl(image.key),
          isPrimary: image.isPrimary,
        })),
      })),
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        hasNextPage: page * pageSize < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    const storeId = await this.requireStoreId(userId);
    this.validatePricing(dto.price, dto.salePrice);
    const slug = `${slugify(dto.name)}-${Date.now().toString(36)}`;
    return this.prisma.db.product.create({
      data: {
        storeId,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        name: dto.name,
        slug,
        sku: dto.sku,
        description: dto.description,
        price: dto.price,
        salePrice: dto.salePrice,
        stock: dto.stock,
        lowStockThreshold: dto.lowStockThreshold,
        releaseDate: this.parseReleaseDate(dto.releaseDate),
        // New listings are submitted for review so they reach the admin
        // moderation queue. They go live only after admin approval.
        status: 'PENDING',
      },
    });
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const storeId = await this.requireStoreId(userId);
    const existing = await this.requireOwnedProduct(storeId, productId);

    const nextPrice = dto.price !== undefined ? dto.price : Number(existing.price);
    const nextSalePrice =
      dto.salePrice !== undefined
        ? dto.salePrice
        : existing.salePrice !== null
          ? Number(existing.salePrice)
          : undefined;
    this.validatePricing(nextPrice, nextSalePrice);

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.salePrice !== undefined) data.salePrice = dto.salePrice;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.categoryId !== undefined) data.category = { connect: { id: dto.categoryId } };
    if (dto.brandId !== undefined) data.brand = { connect: { id: dto.brandId } };
    if (dto.releaseDate !== undefined) data.releaseDate = this.parseReleaseDate(dto.releaseDate);
    if (dto.status !== undefined) {
      // Sellers may never approve their own products — that is admin's job.
      if (dto.status === 'APPROVED') throw new ForbiddenException('Products require admin approval');
      data.status = dto.status as Product['status'];
    }

    // A material edit to an already-approved product sends it BACK for review so
    // sellers cannot silently change live names/prices/descriptions/categories.
    if (existing.status === 'APPROVED' && dto.status === undefined) {
      const material =
        dto.name !== undefined ||
        dto.price !== undefined ||
        dto.salePrice !== undefined ||
        dto.description !== undefined ||
        dto.categoryId !== undefined ||
        dto.brandId !== undefined;
      if (material) data.status = 'PENDING';
    }

    return this.prisma.db.product.update({ where: { id: productId }, data });
  }

  async deleteProduct(userId: string, productId: string): Promise<{ message: string }> {
    const storeId = await this.requireStoreId(userId);
    await this.requireOwnedProduct(storeId, productId);
    await this.prisma.db.product.update({ where: { id: productId }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
    return { message: 'Product removed' };
  }

  async updateInventory(userId: string, productId: string, dto: UpdateStockDto) {
    const storeId = await this.requireStoreId(userId);
    await this.requireOwnedProduct(storeId, productId);
    return this.prisma.db.product.update({
      where: { id: productId },
      data: { stock: dto.stock, lowStockThreshold: dto.lowStockThreshold },
      select: { id: true, stock: true, lowStockThreshold: true },
    });
  }

  // ── Images ────────────────────────────────────────────────────────────────

  async addImages(userId: string, productId: string, images: { key: string; alt?: string }[]) {
    const storeId = await this.requireStoreId(userId);
    await this.requireOwnedProduct(storeId, productId);

    // Only accept objects this user actually uploaded (keys are prefixed with the
    // uploader id), so a seller cannot reference another seller's image.
    const prefix = `images/${userId}/`;
    for (const image of images) {
      if (!image.key.startsWith(prefix)) {
        throw new BadRequestException('Can only attach images you uploaded');
      }
    }

    const count = await this.prisma.db.productImage.count({ where: { productId } });
    await this.prisma.db.productImage.createMany({
      data: images.map((image, index) => ({
        productId,
        key: image.key,
        alt: image.alt,
        sortOrder: count + index,
        isPrimary: count === 0 && index === 0,
      })),
    });
    return this.productWithImages(productId);
  }

  async setPrimaryImage(userId: string, productId: string, imageId: string) {
    const storeId = await this.requireStoreId(userId);
    await this.requireOwnedProduct(storeId, productId);

    const image = await this.prisma.db.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Image not found');

    await this.prisma.db.$transaction([
      this.prisma.db.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
      this.prisma.db.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);
    return this.productWithImages(productId);
  }

  async removeImage(userId: string, productId: string, imageId: string) {
    const storeId = await this.requireStoreId(userId);
    await this.requireOwnedProduct(storeId, productId);

    const image = await this.prisma.db.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Image not found');
    await this.prisma.db.productImage.delete({ where: { id: imageId } });
    // Remove the object itself from storage (not just the row) to avoid leaking data.
    await this.uploads.deleteImage(image.key);
    return this.productWithImages(productId);
  }

  private async productWithImages(productId: string) {
    const product = await this.prisma.db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        images: { orderBy: { sortOrder: 'asc' }, select: { id: true, key: true, alt: true, isPrimary: true } },
      },
    });
    return product;
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async analytics(userId: string) {
    const storeId = await this.requireStoreId(userId);
    // Revenue only counts PAID, non-cancelled orders.
    const where: Prisma.OrderItemWhereInput = {
      storeId,
      status: { not: 'CANCELLED' },
      order: { paymentStatus: 'PAID' },
    };

    const [revenueAgg, orderRows, topGroups] = await this.prisma.db.$transaction([
      this.prisma.db.orderItem.aggregate({ where, _sum: { total: true } }),
      this.prisma.db.orderItem.findMany({ where, select: { orderId: true } }),
      this.prisma.db.orderItem.groupBy({
        by: ['productId'] as const,
        where,
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
    ]);

    const revenue = Number(revenueAgg._sum?.total ?? 0);
    const orderCountValue = new Set(orderRows.map((r) => r.orderId)).size;
    const topProducts = topGroups.map((row) => ({ productId: row.productId, revenue: Number(row._sum?.total ?? 0), sold: row._count }));

    return {
      revenue,
      orderCount: orderCountValue,
      aov: orderCountValue > 0 ? revenue / orderCountValue : 0,
      topProducts,
    };
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  async listOrders(
    userId: string,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<{ id: string; orderId: string; name: string; quantity: number; total: number; status: string; placedAt: string }>> {
    const storeId = await this.requireStoreId(userId);
    const size = Math.min(MAX_PAGE_SIZE, pageSize);
    const where: Prisma.OrderItemWhereInput = { storeId };
    const [total, rows] = await this.prisma.db.$transaction([
      this.prisma.db.orderItem.count({ where }),
      this.prisma.db.orderItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
        include: { order: { select: { placedAt: true } } },
      }),
    ]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        orderId: row.orderId,
        name: row.nameSnapshot,
        quantity: row.quantity,
        total: Number(row.total),
        status: row.status,
        placedAt: row.order.placedAt.toISOString(),
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

  async updateOrderItemStatus(userId: string, orderItemId: string, status: string) {
    if (!SELLER_ORDER_ITEM_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException('Invalid order status');
    }
    const target = status as OrderStatus;
    const storeId = await this.requireStoreId(userId);
    const item = await this.prisma.db.orderItem.findFirst({
      where: { id: orderItemId, storeId },
      include: { order: { select: { paymentStatus: true } } },
    });
    if (!item) throw new ForbiddenException('Not your order');

    // Validate the transition — no illegal jumps, skips, or reversals.
    if (item.status !== target && !SELLER_ORDER_TRANSITIONS[item.status]?.includes(target)) {
      throw new BadRequestException(`Cannot move an order item from ${item.status} to ${target}`);
    }

    // Only paid orders may be marked delivered (unlocks returns/reviews).
    if (target === 'DELIVERED' && item.order.paymentStatus !== 'PAID') {
      throw new BadRequestException('Only paid orders can be marked delivered');
    }

    if (target === 'CANCELLED' && item.status !== target) {
      // Restore the goods to inventory.
      await this.prisma.db.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
      });
      // Seller-cancelling a paid item must refund the customer.
      if (item.order.paymentStatus === 'PAID') {
        await this.payments.refundOrder(item.orderId);
      }
    }

    await this.prisma.db.orderItem.update({ where: { id: orderItemId }, data: { status: target } });
    return this.prisma.db.orderItem.findUnique({ where: { id: orderItemId } });
  }
}
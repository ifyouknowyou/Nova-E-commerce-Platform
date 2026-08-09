import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { MAX_PAGE_SIZE, type PaginatedResult } from '@nova/shared';
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';
import { type ListProductsQueryDto, type ProductSort } from './dto/list-products.query.dto';

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  stock: number;
  ratingAvg: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  /** Future ISO date marks the product as "coming soon" (not yet purchasable). */
  releaseDate: string | null;
  createdAt: string;
  images: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
  store: { name: string; slug: string };
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string } | null;
}

const PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  description: true,
  price: true,
  salePrice: true,
  stock: true,
  ratingAvg: true,
  reviewCount: true,
  soldCount: true,
  isFeatured: true,
  releaseDate: true,
  createdAt: true,
  images: { orderBy: { sortOrder: 'asc' as const }, select: { id: true, key: true, alt: true, isPrimary: true } },
  store: { select: { name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsQueryDto): Promise<PaginatedResult<PublicProduct>> {
    const page = Math.max(1, query.page);
    const pageSize = Math.min(MAX_PAGE_SIZE, query.pageSize);

    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.sort);

    const [total, rows] = await this.prisma.db.$transaction([
      this.prisma.db.product.count({ where }),
      this.prisma.db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: PUBLIC_SELECT,
      }),
    ]);

    const items = rows.map((row) => this.toPublic(row));

    return {
      items,
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

  async findByIdOrSlug(idOrSlug: string): Promise<PublicProduct> {
    const row = await this.prisma.db.product.findFirst({
      where: {
        status: 'APPROVED',
        visibility: 'PUBLIC',
        deletedAt: null,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: PUBLIC_SELECT,
    });
    if (!row) throw new NotFoundException('Product not found');
    return this.toPublic(row);
  }

  async featured(limit = 8): Promise<PublicProduct[]> {
    const rows = await this.prisma.db.product.findMany({
      where: { status: 'APPROVED', visibility: 'PUBLIC', deletedAt: null, isFeatured: true },
      orderBy: { ratingAvg: 'desc' },
      take: limit,
      select: PUBLIC_SELECT,
    });
    return rows.map((row) => this.toPublic(row));
  }

  async bestSellers(limit = 8): Promise<PublicProduct[]> {
    const rows = await this.prisma.db.product.findMany({
      where: { status: 'APPROVED', visibility: 'PUBLIC', deletedAt: null },
      orderBy: { soldCount: 'desc' },
      take: limit,
      select: PUBLIC_SELECT,
    });
    return rows.map((row) => this.toPublic(row));
  }

  async related(productId: string, categoryId: string, limit = 4): Promise<PublicProduct[]> {
    const rows = await this.prisma.db.product.findMany({
      where: {
        status: 'APPROVED',
        visibility: 'PUBLIC',
        deletedAt: null,
        categoryId,
        NOT: { id: productId },
      },
      orderBy: { ratingAvg: 'desc' },
      take: limit,
      select: PUBLIC_SELECT,
    });
    return rows.map((row) => this.toPublic(row));
  }

  private buildWhere(query: ListProductsQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      status: 'APPROVED',
      visibility: 'PUBLIC',
      deletedAt: null,
    };

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.categoryIds?.length) where.categoryId = { in: query.categoryIds };
    if (query.brandId) where.brandId = query.brandId;
    if (query.inStock === 'true') where.stock = { gt: 0 };
    if (query.sale === 'true') where.salePrice = { not: null };
    if (query.sale === 'false') where.salePrice = null;

    if (query.rating) where.ratingAvg = { gte: query.rating };

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const range: Prisma.DecimalFilter = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
      const priceMatch = { OR: [{ price: range }, { salePrice: range }] };
      where.AND = where.AND ? [...(where.AND as Prisma.ProductWhereInput[]), priceMatch] : [priceMatch];
    }

    return where;
  }

  private buildOrderBy(sort: ProductSort): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'popular':
        return { soldCount: 'desc' };
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'rating':
        return { ratingAvg: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private toPublic(row: Prisma.ProductGetPayload<{ select: typeof PUBLIC_SELECT }>): PublicProduct {
    const price = Number(row.price);
    const salePrice = row.salePrice !== null ? Number(row.salePrice) : null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      description: row.description,
      price,
      salePrice,
      effectivePrice: salePrice ?? price,
      stock: row.stock,
      ratingAvg: Number(row.ratingAvg),
      reviewCount: row.reviewCount,
      soldCount: row.soldCount,
      isFeatured: row.isFeatured,
      releaseDate: row.releaseDate?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      images: row.images.map((img) => ({
        id: img.id,
        url: mediaUrl(img.key),
        alt: img.alt,
        isPrimary: img.isPrimary,
      })),
      store: row.store,
      category: row.category,
      brand: row.brand,
    };
  }
}

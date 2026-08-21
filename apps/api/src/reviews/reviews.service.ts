import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from '@nova/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

export interface PublicReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  authorName: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Only customers who bought (and received) the product may review it. */
  async create(userId: string, productId: string, dto: CreateReviewDto): Promise<PublicReview> {
    const product = await this.prisma.db.product.findFirst({
      where: { id: productId, status: 'APPROVED', deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Verified purchase: an order item for this product whose order was paid/fulfilled.
    const purchased = await this.prisma.db.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          paymentStatus: 'PAID',
          OR: [{ status: 'SHIPPED' }, { status: 'DELIVERED' }],
        },
      },
      select: { orderId: true },
    });
    if (!purchased) {
      throw new ForbiddenException('Only verified purchasers can review this product');
    }

    const data = {
      userId,
      productId,
      orderId: purchased.orderId,
      rating: dto.rating,
      title: dto.title ?? undefined,
      comment: dto.comment ?? undefined,
      status: 'APPROVED' as const,
      isVerifiedPurchase: true,
    };
    const existing = await this.prisma.db.review.findFirst({
      where: { userId, productId, orderId: purchased.orderId },
    });
    const review = existing
      ? await this.prisma.db.review.update({ where: { id: existing.id }, data })
      : await this.prisma.db.review.create({ data });

    await this.recalcRating(productId);
    return this.toPublic(review);
  }

  async listForProduct(productId: string, page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<PublicReview>> {
    const size = Math.min(100, pageSize);
    const where = { productId, status: 'APPROVED' as const };
    const total = await this.prisma.db.review.count({ where });
    const rows = await this.prisma.db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      include: { user: { select: { name: true } } },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        authorName: r.user.name ?? 'Customer',
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt.toISOString(),
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

  private async recalcRating(productId: string): Promise<void> {
    const [aggregate] = await this.prisma.db.$transaction([
      this.prisma.db.review.aggregate({
        where: { productId, status: 'APPROVED' as const },
        _avg: { rating: true },
        _count: true,
      }),
    ]);
    await this.prisma.db.product.update({
      where: { id: productId },
      data: { ratingAvg: aggregate._avg.rating ?? 0, reviewCount: aggregate._count },
    });
  }

  private toPublic(review: { id: string; rating: number; title: string | null; comment: string | null; isVerifiedPurchase: boolean; createdAt: Date }): PublicReview {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      authorName: 'You',
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
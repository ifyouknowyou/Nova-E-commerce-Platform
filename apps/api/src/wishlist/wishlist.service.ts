import { Injectable, NotFoundException } from '@nestjs/common';
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';

export interface WishlistItemResponse {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  image: string | null;
  addedAt: string;
}

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<WishlistItemResponse[]> {
    const rows = await this.prisma.db.wishlistItem.findMany({
      // Only surface items whose product is still live — archived, deleted,
      // unapproved, or PRIVATE products are excluded from the wishlist view.
      where: {
        userId,
        product: { status: 'APPROVED', deletedAt: null, visibility: 'PUBLIC' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
        },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      name: row.product.name,
      slug: row.product.slug,
      price: Number(row.product.price),
      salePrice: row.product.salePrice !== null ? Number(row.product.salePrice) : null,
      effectivePrice: row.product.salePrice !== null ? Number(row.product.salePrice) : Number(row.product.price),
      image: row.product.images[0] ? mediaUrl(row.product.images[0].key) : null,
      addedAt: row.createdAt.toISOString(),
    }));
  }

  async add(userId: string, productId: string): Promise<{ message: string }> {
    const product = await this.prisma.db.product.findFirst({
      where: { id: productId, status: 'APPROVED', deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.db.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    return { message: 'Added to wishlist' };
  }

  async remove(userId: string, productId: string): Promise<{ message: string }> {
    await this.prisma.db.wishlistItem.deleteMany({ where: { userId, productId } });
    return { message: 'Removed from wishlist' };
  }
}
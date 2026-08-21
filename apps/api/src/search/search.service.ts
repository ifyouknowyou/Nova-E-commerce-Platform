import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  category: string;
  effectivePrice: number;
  image: string | null;
}

export interface PopularSearch {
  name: string;
  slug: string;
}

const PUBLIC_PRODUCT_WHERE: Prisma.ProductWhereInput = {
  status: 'APPROVED',
  visibility: 'PUBLIC',
  deletedAt: null,
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Autocomplete — lightweight name/sku match, ranked by sales then rating. */
  async suggestions(q: string, limit = 8): Promise<SearchSuggestion[]> {
    const query = q.trim();
    if (!query) return [];
    const rows = await this.prisma.db.product.findMany({
      where: {
        ...PUBLIC_PRODUCT_WHERE,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ soldCount: 'desc' }, { ratingAvg: 'desc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { key: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category.name,
      effectivePrice: row.salePrice !== null ? Number(row.salePrice) : Number(row.price),
      image: row.images[0] ? mediaUrl(row.images[0].key) : null,
    }));
  }

  /** Popular searches — surfaces the best-selling product names. */
  async popular(limit = 8): Promise<PopularSearch[]> {
    const rows = await this.prisma.db.product.findMany({
      where: PUBLIC_PRODUCT_WHERE,
      orderBy: { soldCount: 'desc' },
      take: limit,
      select: { name: true, slug: true },
    });
    return rows.map((row) => ({ name: row.name, slug: row.slug }));
  }
}

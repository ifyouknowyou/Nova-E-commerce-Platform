import { Injectable } from '@nestjs/common';
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
}

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PublicBrand[]> {
    const brands = await this.prisma.db.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logoKey: true,
        _count: { select: { products: true } },
      },
    });
    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoKey ? mediaUrl(brand.logoKey) : null,
      productCount: brand._count.products,
    }));
  }
}

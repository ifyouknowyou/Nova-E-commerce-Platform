import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Store } from '@prisma/client';
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

/** A seller may operate up to this many (non-deleted) stores. */
export const MAX_STORES_PER_SELLER = 3;

export interface StoreResponse {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: Store['status'];
  createdAt: string;
}

function toResponse(store: Store): StoreResponse {
  const businessInfo = (store.businessInfo as Record<string, unknown> | null) ?? {};
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    bio: store.bio,
    contactEmail: typeof businessInfo.contactEmail === 'string' ? businessInfo.contactEmail : null,
    logoUrl: store.logoKey ? mediaUrl(store.logoKey) : null,
    bannerUrl: store.bannerKey ? mediaUrl(store.bannerKey) : null,
    status: store.status,
    createdAt: store.createdAt.toISOString(),
  };
}

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  /** The seller's most recent store, or null if they have not onboarded. */
  async getMyStore(userId: string): Promise<StoreResponse | null> {
    const store = await this.prisma.db.store.findFirst({
      where: { sellerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return store ? toResponse(store) : null;
  }

  /**
   * Create a store — an *application* to become a seller. The store starts in
   * PENDING and the user does NOT receive the SELLER role here; only an admin
   * approving the store (admin.service setStoreStatus → ACTIVE) grants SELLER.
   */
  async createStore(userId: string, dto: CreateStoreDto): Promise<StoreResponse> {
    const storeCount = await this.prisma.db.store.count({
      where: { sellerId: userId, deletedAt: null },
    });
    if (storeCount >= MAX_STORES_PER_SELLER) {
      throw new ConflictException(`You can have at most ${MAX_STORES_PER_SELLER} stores`);
    }

    const slug = await this.availableSlug(dto.slug ?? slugify(dto.name));

    const store = await this.prisma.db.store.create({
      data: {
        sellerId: userId,
        name: dto.name,
        slug,
        bio: dto.bio,
        businessInfo: dto.description ? { description: dto.description } : undefined,
        status: 'PENDING',
      },
    });

    return toResponse(store);
  }

  async updateStore(userId: string, dto: UpdateStoreDto): Promise<StoreResponse> {
    const owned = await this.prisma.db.store.findFirst({
      where: { sellerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!owned) throw new UnauthorizedException('No store found for this account');

    const store = await this.prisma.db.store.update({
      where: { id: owned.id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.contactEmail !== undefined
          ? { businessInfo: { ...((owned.businessInfo as Record<string, unknown>) ?? {}), contactEmail: dto.contactEmail } }
          : {}),
      },
    });
    await this.prisma.db.auditLog.create({
      data: { userId, action: 'store.update', entityType: 'store', entityId: owned.id },
    });
    return toResponse(store);
  }

  async getStoreBySlug(slug: string): Promise<StoreResponse | null> {
    // Only active, non-deleted stores are reachable by their public slug.
    const store = await this.prisma.db.store.findFirst({
      where: { slug, deletedAt: null, status: 'ACTIVE' },
    });
    return store ? toResponse(store) : null;
  }

  private async availableSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.db.store.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix++}`;
    }
    return candidate;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
import { Injectable } from '@nestjs/common';
import type { Category } from '@prisma/client';
import { mediaUrl } from '../common/media-url';
import { PrismaService } from '../prisma/prisma.service';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Flat list of active categories (top-level). */
  async list(): Promise<CategoryNode[]> {
    const categories = await this.prisma.db.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return buildTree(categories);
  }
}

function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  for (const category of categories) {
    map.set(category.id, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageKey ? mediaUrl(category.imageKey) : null,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const category of categories) {
    const node = map.get(category.id);
    if (!node) continue;
    if (category.parentId && map.has(category.parentId)) {
      map.get(category.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

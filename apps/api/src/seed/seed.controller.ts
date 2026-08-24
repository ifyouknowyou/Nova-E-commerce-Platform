import { Controller, Get, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Public } from '../rbac/decorators/public.decorator';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Production seed endpoint — one-shot, idempotent.
 *
 * Required header: X-Seed-Token <same value as ADMIN_PASSWORD env var>
 *
 * Usage:
 *   curl -H "X-Seed-Token: <ADMIN_PASSWORD>" https://nova-api-4k4c.onrender.com/api/seed/now
 */
@Controller('seed')
export class SeedController {
  private readonly logger = new Logger(SeedController.name);

  @Get('now')
  @Public()
  @HttpCode(HttpStatus.OK)
  async seedOnce(
    @Headers('x-seed-token') seedToken: string,
  ): Promise<{ ok: boolean; message: string; seedCreated?: number }> {
    const expectedToken = process.env.ADMIN_PASSWORD;
    if (!expectedToken) {
      return { ok: false, message: 'ADMIN_PASSWORD not configured' };
    }
    if (seedToken !== expectedToken) {
      this.logger.warn('Unauthorized seed attempt');
      return { ok: false, message: 'Invalid seed token' };
    }

    const prisma = new PrismaClient();
    try {
      // Idempotency gate
      const existing = await prisma.category.findFirst();
      if (existing) {
        this.logger.log('Database already seeded — skipping');
        return { ok: true, message: 'Already seeded', seedCreated: 0 };
      }

      // Roles
      const roles = [
        { code: 'CUSTOMER', name: 'Customer' },
        { code: 'SELLER', name: 'Seller' },
        { code: 'ADMIN', name: 'Administrator' },
      ];
      for (const role of roles) {
        await prisma.role.upsert({ where: { code: role.code }, create: role, update: {} });
      }

      // Permissions
      const permissions = [
        'products:read', 'products:create', 'products:update', 'products:delete',
        'cart:manage', 'checkout:manage', 'orders:read', 'orders:update',
        'store:manage', 'analytics:read', 'settings:manage',
      ];
      for (const code of permissions) {
        await prisma.permission.upsert({ where: { code }, create: { code, name: code }, update: {} });
      }

      // Admin role permissions
      const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
      if (adminRole) {
        const permList = await prisma.permission.findMany({ where: { code: { in: permissions } } });
        for (const perm of permList) {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
            create: { roleId: adminRole.id, permissionId: perm.id },
            update: {},
          });
        }
      }

      // Users
      const adminHash = await argon2.hash(expectedToken);
      const sellerHash = await argon2.hash('SellerPassw0rd!');
      await prisma.user.create({
        data: { email: 'admin@nova.test', password: adminHash, role: 'ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date() },
      });
      await prisma.user.create({
        data: { email: 'seller@nova.test', password: sellerHash, role: 'SELLER', status: 'ACTIVE', emailVerifiedAt: new Date() },
      });

      // Store
      const seller = await prisma.user.findFirst({ where: { role: 'SELLER' } });
      const store = await prisma.store.create({
        data: { name: 'NOVA Demo Store', slug: 'nova-demo', ownerId: seller?.id, status: 'ACTIVE' },
      });

      // Categories
      const categories = [
        { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
        { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories' },
        { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home and kitchen essentials' },
        { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Sports and outdoor gear' },
      ];
      for (const cat of categories) {
        await prisma.category.upsert({ where: { slug: cat.slug }, create: cat, update: {} });
      }

      // Brands
      const brandNames = ['Aurora', 'Vertex', 'Zenith'];
      for (const name of brandNames) {
        await prisma.brand.upsert({ where: { slug: name.toLowerCase() }, create: { name, slug: name.toLowerCase() }, update: {} });
      }

      // Products
      const products = [
        { name: 'Aurora Wireless Headphones', slug: 'aurora-wireless-headphones', sku: 'AUR-HP-001', price: 19900, salePrice: 14900, stock: 42, categorySlug: 'headphones', brand: 'Aurora', description: 'Noise-cancelling over-ear headphones', status: 'APPROVED', featured: true },
        { name: 'Vertex Smart Watch', slug: 'vertex-smart-watch', sku: 'VRT-WT-001', price: 12900, salePrice: 9900, stock: 25, categorySlug: 'wearables', brand: 'Vertex', description: 'Fitness tracking smartwatch', status: 'APPROVED', featured: true },
        { name: 'Zenith Running Shoes', slug: 'zenith-running-shoes', sku: 'ZNT-SH-001', price: 11000, salePrice: null, stock: 18, categorySlug: 'sports-outdoors', brand: 'Zenith', description: 'Lightweight running shoes', status: 'APPROVED', featured: true },
      ];
      for (const product of products) {
        const category = await prisma.category.findUnique({ where: { slug: product.categorySlug } });
        const brand = await prisma.brand.findUnique({ where: { slug: product.brand.toLowerCase() } });
        if (category && brand) {
          await prisma.product.upsert({
            where: { storeId_slug: { storeId: store.id, slug: product.slug } },
            create: { ...product, storeId: store.id, categoryId: category.id, brandId: brand.id },
            update: {},
          });
        }
      }

      // Settings
      const settings = [
        { key: 'platform.name', group: 'platform', value: 'NOVA Commerce' },
        { key: 'taxes.rate', group: 'taxes', value: '0.08' },
      ];
      for (const setting of settings) {
        await prisma.setting.upsert({ where: { key: setting.key }, create: setting, update: { value: setting.value } });
      }

      this.logger.log('Database seeded successfully');
      return { ok: true, message: 'Database seeded', seedCreated: 1 };
    } finally {
      await prisma.$disconnect();
    }
  }
}

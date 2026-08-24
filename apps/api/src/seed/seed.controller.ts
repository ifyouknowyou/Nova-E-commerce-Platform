import { Controller, Get, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Public } from '../rbac/decorators/public.decorator';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

@Controller('seed')
export class SeedController {
  private readonly logger = new Logger(SeedController.name);

  @Get('now')
  @Public()
  @HttpCode(HttpStatus.OK)
  async seedOnce(@Headers('x-seed-token') seedToken?: string): Promise<{ ok: boolean; message: string }> {
    const expectedToken = process.env.ADMIN_PASSWORD;
    if (!expectedToken) return { ok: false, message: 'ADMIN_PASSWORD not configured' };
    if (seedToken !== expectedToken) {
      this.logger.warn('Unauthorized seed attempt');
      return { ok: false, message: 'Invalid seed token' };
    }

    const prisma = new PrismaClient();
    try {
      const existing = await prisma.category.findFirst();
      if (existing) {
        this.logger.log('Database already seeded — skipping');
        return { ok: true, message: 'Already seeded' };
      }

      // Roles
      for (const role of [{ code: 'CUSTOMER', name: 'Customer' }, { code: 'SELLER', name: 'Seller' }, { code: 'ADMIN', name: 'Administrator' }]) {
        await prisma.role.upsert({ where: { code: role.code }, create: role, update: {} });
      }

      // Permissions
      const permCodes = ['products:read', 'products:create', 'products:update', 'products:delete', 'cart:manage', 'checkout:manage', 'orders:read', 'orders:update', 'store:manage', 'analytics:read', 'settings:manage'];
      for (const code of permCodes) {
        await prisma.permission.upsert({ where: { code }, create: { code, module: code.split(":")[0] || "unknown" }, update: {} });
      }

      // Admin role permissions
      const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
      if (adminRole) {
        const perms = await prisma.permission.findMany({ where: { code: { in: permCodes } } });
        for (const perm of perms) {
          await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } }, create: { roleId: adminRole.id, permissionId: perm.id }, update: {} });
        }
      }

      // Users
      const adminHash = await argon2.hash(expectedToken);
      const sellerHash = await argon2.hash('SellerPassw0rd!');
      const adminUser = await prisma.user.create({ data: { email: 'admin@nova.test', passwordHash: adminHash, status: 'ACTIVE', emailVerifiedAt: new Date() } });
      const sellerUser = await prisma.user.create({ data: { email: 'seller@nova.test', passwordHash: sellerHash, status: 'ACTIVE', emailVerifiedAt: new Date() } });

      // Roles
      const sellerRole = await prisma.role.findUnique({ where: { code: 'SELLER' } });
      if (adminRole) await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
      if (sellerRole) await prisma.userRole.create({ data: { userId: sellerUser.id, roleId: sellerRole.id } });

      // Store
      const store = await prisma.store.create({ data: { name: 'NOVA Demo Store', slug: 'nova-demo', sellerId: sellerUser.id, status: 'ACTIVE' } });

      // Categories
      for (const cat of [{ name: 'Electronics', slug: 'electronics' }, { name: 'Fashion', slug: 'fashion' }, { name: 'Home & Kitchen', slug: 'home-kitchen' }, { name: 'Sports & Outdoors', slug: 'sports-outdoors' }]) {
        await prisma.category.upsert({ where: { slug: cat.slug }, create: cat, update: {} });
      }

      // Brands
      for (const name of ['Aurora', 'Vertex', 'Zenith']) {
        await prisma.brand.upsert({ where: { slug: name.toLowerCase() }, create: { name, slug: name.toLowerCase() }, update: {} });
      }

      // Products
      const productData = [
        { name: 'Aurora Wireless Headphones', slug: 'aurora-wireless-headphones', sku: 'AUR-HP-001', price: 199.00, salePrice: 149.00, stock: 42, categorySlug: 'headphones', brandSlug: 'aurora', description: 'Noise-cancelling over-ear headphones', status: 'APPROVED', isFeatured: true },
        { name: 'Vertex Smart Watch', slug: 'vertex-smart-watch', sku: 'VRT-WT-001', price: 129.00, salePrice: 99.00, stock: 25, categorySlug: 'wearables', brandSlug: 'vertex', description: 'Fitness tracking smartwatch', status: 'APPROVED', isFeatured: true },
        { name: 'Zenith Running Shoes', slug: 'zenith-running-shoes', sku: 'ZNT-SH-001', price: 110.00, salePrice: null, stock: 18, categorySlug: 'sports-outdoors', brandSlug: 'zenith', description: 'Lightweight running shoes', status: 'APPROVED', isFeatured: true },
      ];
      for (const p of productData) {
        const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
        const brand = await prisma.brand.findUnique({ where: { slug: p.brandSlug } });
        if (category && brand) {
          await prisma.product.upsert({
            where: { storeId_slug: { storeId: store.id, slug: p.slug } },
            create: { storeId: store.id, categoryId: category.id, brandId: brand.id, name: p.name, slug: p.slug, sku: p.sku, price: p.price, salePrice: p.salePrice, stock: p.stock, description: p.description, status: p.status as never, isFeatured: p.isFeatured },
            update: {},
          });
        }
      }

      // Settings
      for (const setting of [{ key: 'platform.name', group: 'platform', value: 'NOVA Commerce' }, { key: 'taxes.rate', group: 'taxes', value: '0.08' }]) {
        await prisma.setting.upsert({ where: { key: setting.key }, create: setting, update: { value: setting.value } });
      }

      this.logger.log('Database seeded successfully');
      return { ok: true, message: 'Database seeded' };
    } finally {
      await prisma.$disconnect();
    }
  }
}

/**
 * NOVA COMMERCE — database seed.
 *
 * Idempotent: safe to run repeatedly (upserts where possible).
 * Creates: roles+permissions, admin & seller users, a store, categories,
 * brands, sample products, and platform settings.
 */
import { readFileSync } from 'node:fs';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

// Load DATABASE_URL from packages/db/.env when not already present.
if (!process.env.DATABASE_URL) {
  const env = readFileSync(`${process.cwd()}/.env`, 'utf8');
  const match = env.match(/DATABASE_URL="?([^"\n]+)"?/);
  if (match) process.env.DATABASE_URL = match[1];
}

const prisma = new PrismaClient();

const RBAC: { code: string; name: string; permissions: string[] }[] = [
  { code: 'CUSTOMER', name: 'Customer', permissions: ['products:read', 'cart:manage', 'checkout:manage', 'orders:read'] },
  { code: 'SELLER', name: 'Seller', permissions: ['products:read', 'products:create', 'products:update', 'products:delete', 'store:manage', 'inventory:manage', 'orders:read', 'orders:update', 'coupons:manage', 'analytics:read'] },
  { code: 'ADMIN', name: 'Administrator', permissions: ['products:read', 'products:create', 'products:update', 'products:delete', 'products:approve', 'categories:manage', 'brands:manage', 'cart:manage', 'checkout:manage', 'orders:read', 'orders:update', 'orders:refund', 'coupons:manage', 'reviews:manage', 'users:manage', 'sellers:manage', 'store:manage', 'inventory:manage', 'analytics:read', 'reports:read', 'settings:manage', 'roles:manage'] },
];

const CATEGORIES: { name: string; slug: string; children?: { name: string; slug: string }[] }[] = [
  { name: 'Electronics', slug: 'electronics', children: [{ name: 'Headphones', slug: 'headphones' }, { name: 'Wearables', slug: 'wearables' }] },
  { name: 'Fashion', slug: 'fashion', children: [{ name: "Men's", slug: 'mens' }, { name: "Women's", slug: 'womens' }] },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
];

const BRANDS = ['Aurora', 'Vertex', 'Zenith'];

const PRODUCTS: { name: string; slug: string; sku: string; price: number; salePrice: number | null; stock: number; categorySlug: string; brand: string; description: string; featured: boolean }[] = [
  { name: 'Aurora Wireless Headphones', slug: 'aurora-wireless-headphones', sku: 'AUR-HP-001', price: 199, salePrice: 149, stock: 42, categorySlug: 'headphones', brand: 'Aurora', description: 'Noise-cancelling over-ear headphones with 40-hour battery life and premium sound.', featured: true },
  { name: 'Vertex Smart Watch', slug: 'vertex-smart-watch', sku: 'VRT-WT-001', price: 129, salePrice: 99, stock: 25, categorySlug: 'wearables', brand: 'Vertex', description: 'Fitness tracking, GPS, heart-rate monitor, and 7-day battery.', featured: true },
  { name: 'Zenith Running Shoes', slug: 'zenith-running-shoes', sku: 'ZNT-SH-001', price: 110, salePrice: null, stock: 18, categorySlug: 'sports-outdoors', brand: 'Zenith', description: 'Lightweight running shoes with responsive cushioning.', featured: true },
  { name: 'Aurora Earbuds Pro', slug: 'aurora-earbuds-pro', sku: 'AUR-EB-001', price: 89, salePrice: 69, stock: 60, categorySlug: 'headphones', brand: 'Aurora', description: 'True wireless earbuds with active noise cancellation.', featured: false },
  { name: 'Vertex Smart Speaker', slug: 'vertex-smart-speaker', sku: 'VRT-SP-001', price: 149, salePrice: null, stock: 30, categorySlug: 'electronics', brand: 'Vertex', description: 'Room-filling sound with voice assistant built in.', featured: false },
  { name: 'Zenith Yoga Mat', slug: 'zenith-yoga-mat', sku: 'ZNT-YG-001', price: 35, salePrice: 29, stock: 80, categorySlug: 'sports-outdoors', brand: 'Zenith', description: 'Non-slip, eco-friendly yoga mat with carrying strap.', featured: false },
  { name: "Vertex Slim Fit Shirt", slug: 'vertex-slim-fit-shirt', sku: 'VRT-SH-001', price: 45, salePrice: null, stock: 55, categorySlug: 'mens', brand: 'Vertex', description: 'Modern slim-fit cotton shirt, machine washable.', featured: false },
  { name: 'Aurora Travel Mug', slug: 'aurora-travel-mug', sku: 'AUR-MG-001', price: 25, salePrice: 19, stock: 120, categorySlug: 'home-kitchen', brand: 'Aurora', description: 'Vacuum-insulated stainless travel mug, 500 ml.', featured: false },
];

async function seedRoles(): Promise<void> {
  for (const role of RBAC) {
    await prisma.role.upsert({ where: { code: role.code }, create: { code: role.code, name: role.name, isSystem: true }, update: { name: role.name } });
  }
  const permissions = await prisma.permission.findMany();
  const byCode = new Map(permissions.map((p) => [p.code, p.id]));
  for (const role of RBAC) {
    const dbRole = await prisma.role.findUnique({ where: { code: role.code } });
    if (!dbRole) continue;
    for (const code of role.permissions) {
      const permissionId = byCode.get(code);
      if (!permissionId) {
        const created = await prisma.permission.create({ data: { code, module: code.split(':')[0] ?? 'system' } });
        byCode.set(code, created.id);
        await prisma.rolePermission.create({ data: { roleId: dbRole.id, permissionId: created.id } });
      } else {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: dbRole.id, permissionId } },
          create: { roleId: dbRole.id, permissionId },
          update: {},
        });
      }
    }
  }
}

async function upsertUser(email: string, name: string, password: string, roleCode: string): Promise<string> {
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name, passwordHash: hash, emailVerifiedAt: new Date(), status: 'ACTIVE' },
    });
  }
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (role) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }
  return user.id;
}

async function main(): Promise<void> {
  console.log('Seeding NOVA Commerce…');
  await seedRoles();

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@nova.test';
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV === 'production' && !adminPassword) {
    throw new Error('ADMIN_PASSWORD must be set in production — do not seed default admin credentials');
  }
  const adminId = await upsertUser(adminEmail, 'NOVA Admin', adminPassword ?? 'AdminPassw0rd!', 'ADMIN');
  const sellerId = await upsertUser('seller@nova.test', 'Aurora Store', 'SellerPassw0rd!', 'SELLER');
  console.log(`  admin: ${adminId} / seller: ${sellerId}`);

  let store = await prisma.store.findFirst({ where: { sellerId } });
  if (store) {
    store = await prisma.store.update({
      where: { id: store.id },
      data: { name: 'Aurora Store', status: 'ACTIVE' },
    });
  } else {
    store = await prisma.store.create({
      data: { sellerId, name: 'Aurora Store', slug: 'aurora-store', bio: 'Premium electronics and lifestyle goods.', status: 'ACTIVE', commissionRate: 0.1 },
    });
  }

  const brandIds = new Map<string, string>();
  for (const name of BRANDS) {
    const brand = await prisma.brand.upsert({ where: { slug: name.toLowerCase() }, create: { name, slug: name.toLowerCase() }, update: { name } });
    brandIds.set(name, brand.id);
  }

  const categoryIds = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const top = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug, isActive: true },
      update: { name: cat.name, isActive: true },
    });
    categoryIds.set(cat.slug, top.id);
    for (const child of cat.children ?? []) {
      const c = await prisma.category.upsert({
        where: { slug: child.slug },
        create: { name: child.name, slug: child.slug, parentId: top.id, isActive: true },
        update: { name: child.name, isActive: true },
      });
      categoryIds.set(child.slug, c.id);
    }
  }

  for (const product of PRODUCTS) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) continue;
    const brandId = brandIds.get(product.brand);
    await prisma.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: product.slug } },
      create: {
        storeId: store.id,
        categoryId,
        brandId,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        status: 'APPROVED',
        visibility: 'PUBLIC',
        isFeatured: product.featured,
      },
      update: { name: product.name, description: product.description, price: product.price, salePrice: product.salePrice, stock: product.stock, isFeatured: product.featured },
    });
  }

  const settings: { key: string; group: string; value: unknown }[] = [
    { key: 'currency', group: 'store', value: 'USD' },
    { key: 'shipping', group: 'shipping', value: { freeThreshold: 50, standard: 4.99, express: 9.99 } },
    { key: 'taxes.rate', group: 'taxes', value: 0.08 },
    { key: 'orders', group: 'orders', value: { cancellationWindowHours: 24 } },
  ];
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, group: setting.group, value: setting.value as never },
      update: { group: setting.group, value: setting.value as never },
    });
  }

  console.log(`Seeding complete: ${PRODUCTS.length} products, ${CATEGORIES.length} top categories, ${BRANDS.length} brands.`);
  console.log('Sign-ins — Admin: admin@nova.test / AdminPassw0rd! · Seller: seller@nova.test / SellerPassw0rd!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
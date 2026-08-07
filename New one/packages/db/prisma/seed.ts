/**
 * NEXUS OS — DB seed.
 *
 * Connects as the migrator (DATABASE_MIGRATE_URL, BYPASSRLS) so it can insert
 * cross-tenant rows (permissions catalogue + a demo org) that RLS would
 * otherwise hide. Idempotent: safe to run repeatedly.
 */
import { config } from 'dotenv';
import path from 'node:path';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

config({ path: path.resolve(__dirname, '../../../.env') });
import {
  PERMISSION_SPECS,
  ROLE_CODES,
  type RoleCode,
} from '@nexus/shared';

const migrateClient = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_MIGRATE_URL } },
});

// Role → permission-code wiring (authoritative RBAC matrix, seeded as data).
// Extend per-module in later phases; the guard reads these rows at runtime.
const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  OWNER: ['*'],
  ADMIN: ['*'],
  MANAGER: ['iam.roles.read', 'iam.members.read', 'org.read', 'settings.read', 'audit.read',
    'dashboard.read', 'crm.*', 'project.*', 'inventory.*', 'support.ticket.*', 'search.read', 'notification.*',
    'sales.product.read', 'sales.target.read', 'finance.invoice.read', 'finance.expense.read'],
  SALES: ['org.read', 'iam.members.read', 'dashboard.read',
    'crm.lead.*', 'crm.deal.*', 'crm.contact.read', 'crm.company.read', 'crm.activity.*',
    'sales.quote.*', 'sales.product.read', 'sales.target.read', 'search.read'],
  FINANCE: ['org.read', 'dashboard.read', 'analytics.read',
    'finance.*', 'crm.company.read', 'crm.contact.read', 'search.read'],
  OPERATIONS: ['org.read', 'audit.read', 'dashboard.read',
    'project.*', 'sales.product.*', 'finance.invoice.read', 'finance.expense.read',
    'inventory.*', 'support.ticket.*', 'hr.employee.read', 'documents.read', 'search.read', 'notification.*'],
  HR: ['org.read', 'iam.members.read', 'hr.*', 'documents.read', 'search.read', 'notification.*'],
  SUPPORT: ['org.read', 'dashboard.read', 'crm.company.read', 'crm.contact.read', 'project.task.read',
    'support.ticket.*', 'search.read', 'notification.*'],
};

const ROLE_NAMES: Record<RoleCode, string> = {
  OWNER: 'Owner',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  SALES: 'Sales',
  FINANCE: 'Finance',
  OPERATIONS: 'Operations',
  HR: 'HR',
  SUPPORT: 'Support',
};

function matches(permCode: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('.*')) return permCode.startsWith(pattern.slice(0, -1));
  return permCode === pattern;
}

async function main() {
  // ---- Permissions catalogue -------------------------------------------------
  for (const spec of PERMISSION_SPECS) {
    const action = spec.action.toUpperCase() as
      | 'READ'
      | 'CREATE'
      | 'UPDATE'
      | 'DELETE'
      | 'EXECUTE'
      | 'MANAGE';
    await migrateClient.permission.upsert({
      where: { code: spec.code },
      update: { entity: spec.entity, action, description: spec.description },
      create: {
        code: spec.code,
        entity: spec.entity,
        action,
        description: spec.description,
      },
    });
  }

  // ---- Demo organization + owner ---------------------------------------------
  const org = await migrateClient.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme' },
  });

  const ownerPasswordHash = await hash('nexus-demo-password', 10);

  const ownerUser = await migrateClient.user.upsert({
    where: { email: 'admin@nexus.local' },
    update: { passwordHash: ownerPasswordHash },
    create: { email: 'admin@nexus.local', name: 'NEXUS Admin', passwordHash: ownerPasswordHash },
  });

  const member = await migrateClient.organizationMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: ownerUser.id } },
    update: { status: 'ACTIVE' },
    create: { orgId: org.id, userId: ownerUser.id, status: 'ACTIVE' },
  });

  // ---- Org-scoped roles + role-permission wiring ------------------------------
  for (const code of ROLE_CODES) {
    const role = await migrateClient.role.upsert({
      where: { orgId_code: { orgId: org.id, code } },
      update: {},
      create: {
        orgId: org.id,
        code,
        name: ROLE_NAMES[code],
        isSystem: true,
      },
    });

    // Owner always holds every permission.
    const patterns = ROLE_PERMISSIONS[code];
    const perms = await migrateClient.permission.findMany();

    for (const perm of perms) {
      if (patterns.some((p) => matches(perm.code, p))) {
        await migrateClient.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }

    // Owner user carries the OWNER role for the demo org.
    if (code === 'OWNER') {
      await migrateClient.membershipRole.upsert({
        where: { memberId_roleId: { memberId: member.id, roleId: role.id } },
        update: {},
        create: { memberId: member.id, roleId: role.id },
      });
    }
  }

  // ---- Org-scoped settings: default password policy ----------------------------
  const policyDefaults: { key: string; value: unknown }[] = [
    { key: 'security.password.minLength', value: 10 },
    { key: 'security.password.requireUppercase', value: true },
    { key: 'security.password.requireLowercase', value: true },
    { key: 'security.password.requireDigit', value: true },
    { key: 'security.password.requireSymbol', value: false },
  ];
  for (const p of policyDefaults) {
    await migrateClient.setting.upsert({
      where: { orgId_key: { orgId: org.id, key: p.key } },
      update: { value: p.value as never },
      create: { orgId: org.id, key: p.key, value: p.value as never },
    });
  }

  // ---- Beta org (org switching + cross-tenant routes) --------------------------
  const beta = await migrateClient.organization.upsert({
    where: { slug: 'beta' },
    update: {},
    create: { name: 'Beta Corp', slug: 'beta' },
  });
  const betaOwner = await migrateClient.user.upsert({
    where: { email: 'beta@nexus.local' },
    update: { passwordHash: ownerPasswordHash },
    create: { email: 'beta@nexus.local', name: 'Beta Owner', passwordHash: ownerPasswordHash },
  });
  const betaMember = await migrateClient.organizationMember.upsert({
    where: { orgId_userId: { orgId: beta.id, userId: betaOwner.id } },
    update: { status: 'ACTIVE' },
    create: { orgId: beta.id, userId: betaOwner.id, status: 'ACTIVE' },
  });
  for (const code of ROLE_CODES) {
    const role = await migrateClient.role.upsert({
      where: { orgId_code: { orgId: beta.id, code } },
      update: {},
      create: { orgId: beta.id, code, name: ROLE_NAMES[code], isSystem: true },
    });
    const perms = await migrateClient.permission.findMany();
    for (const perm of perms) {
      if (ROLE_PERMISSIONS[code].some((p) => matches(perm.code, p))) {
        await migrateClient.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
    if (code === 'OWNER') {
      await migrateClient.membershipRole.upsert({
        where: { memberId_roleId: { memberId: betaMember.id, roleId: role.id } },
        update: {},
        create: { memberId: betaMember.id, roleId: role.id },
      });
    }
  }

  // ---- A demo webhook connector for the acme org ------------------------------
  const webhookId = 'd1f0a9b2-0000-4000-8000-000000000001';
  await migrateClient.integration.upsert({
    where: { id: webhookId },
    update: {},
    create: {
      id: webhookId,
      orgId: org.id,
      provider: 'WEBHOOK',
      name: 'Demo Webhook',
      config: { url: 'https://httpbin.org/post' },
      status: 'DISCONNECTED',
    },
  });

  // ---- Phase 3: rich revenue-module demo data for the acme org ----------------
  const { c: companyCount, acc: accountCount } = await seedBusinessData(org.id, migrateClient);
  await seedOpsData(org.id, migrateClient);

  console.log(
    `Seeded: ${PERMISSION_SPECS.length} permissions, 8 roles x 2 orgs, policy settings, webhook connector, Phase3 business data, and Phase4 ops data.`,
  );
}

/** Phase-4 demo rows: inventory ledger, tickets, employees, notifications. */
async function seedOpsData(orgId: string, db: PrismaClient) {
  await db.stockMovement.deleteMany({ where: { orgId } });
  await db.stockLevel.deleteMany({ where: { orgId } });
  await db.ticketComment.deleteMany({ where: { orgId } });
  await db.ticket.deleteMany({ where: { orgId } });
  await db.employee.deleteMany({ where: { orgId } });
  await db.department.deleteMany({ where: { orgId } });

  // Inventory: one warehouse + location, a few products with opening stock.
  const wh = await db.warehouse.create({ data: { orgId, name: 'Central Warehouse' } });
  const loc = await db.stockLocation.create({ data: { orgId, warehouseId: wh.id, name: 'Aisle A' } });
  const prod = await db.product.create({ data: { orgId, name: 'Cloud Seat', sku: 'CLOUD-1', price: 40, reorderLevel: 5 } });
  await db.stockLevel.create({ data: { orgId, productId: prod.id, locationId: loc.id, qty: 2 } });
  await db.stockMovement.createMany({
    data: [
      { orgId, productId: prod.id, locationId: loc.id, type: 'IN', qty: 10, note: 'opening stock' },
      { orgId, productId: prod.id, locationId: loc.id, type: 'OUT', qty: 8, note: 'sold' },
    ],
  });

  // Support: an open ticket with a public comment + an internal note.
  const adminUser = await db.user.findFirstOrThrow({ where: { email: 'admin@nexus.local' } });
  const ticket = await db.ticket.create({
    data: { orgId, subject: 'Cannot reset password', status: 'IN_PROGRESS', priority: 'HIGH', createdById: adminUser.id },
  });
  await db.ticketComment.create({ data: { orgId, ticketId: ticket.id, authorId: adminUser.id, body: 'Reported by customer.' } });
  await db.ticketComment.create({ data: { orgId, ticketId: ticket.id, authorId: adminUser.id, body: 'Waiting on IDP', internal: true } });

  // HR: a department + a couple of employees.
  const eng = await db.department.create({ data: { orgId, name: 'Engineering' } });
  await db.employee.createMany({
    data: [
      { orgId, departmentId: eng.id, firstName: 'Ada', lastName: 'Lovelace', title: 'Eng Lead', email: 'ada@nexus.local', status: 'ACTIVE' },
      { orgId, departmentId: eng.id, firstName: 'Grace', lastName: 'Hopper', title: 'Engineer', email: 'grace@nexus.local', status: 'ACTIVE' },
    ],
  });

  // Notifications: seed a couple for the owner.
  const members = await db.organizationMember.findMany({ where: { orgId, status: 'ACTIVE' } });
  for (const m of members) {
    await db.notification.create({
      data: { orgId, userId: m.userId, type: 'INFO', title: 'Welcome to NEXUS OS', body: 'Your workspace is ready.' },
    });
    await db.notification.create({
      data: { orgId, userId: m.userId, type: 'WARNING', title: 'Low stock: Cloud Log', body: 'Reorder is due.' },
    });
  }
  await db.notification.updateMany({ where: { orgId, title: 'Welcome to NEXUS OS' }, data: { readAt: new Date() } });
}

/** Phase-3 demo rows for a tenant — real DB writes so the dashboard has live KPIs. */
async function seedBusinessData(orgId: string, db: PrismaClient) {
  // Reset tenant business rows so re-seeding is idempotent (safe ordering for FK columns).
  await db.payment.deleteMany({ where: { orgId } });
  await db.invoiceItem.deleteMany({ where: { orgId } });
  await db.invoice.deleteMany({ where: { orgId } });
  await db.expense.deleteMany({ where: { orgId } });
  await db.vendor.deleteMany({ where: { orgId } });
  await db.transaction.deleteMany({ where: { orgId } });
  await db.account.deleteMany({ where: { orgId } });
  await db.taskComment.deleteMany({ where: { orgId } });
  await db.milestone.deleteMany({ where: { orgId } });
  await db.task.deleteMany({ where: { orgId } });
  await db.projectMember.deleteMany({ where: { orgId } });
  await db.project.deleteMany({ where: { orgId } });
  await db.salesTarget.deleteMany({ where: { orgId } });
  await db.quoteItem.deleteMany({ where: { orgId } });
  await db.quote.deleteMany({ where: { orgId } });
  await db.product.deleteMany({ where: { orgId } });
  await db.note.deleteMany({ where: { orgId } });
  await db.activity.deleteMany({ where: { orgId } });
  await db.deal.deleteMany({ where: { orgId } });
  await db.lead.deleteMany({ where: { orgId } });
  await db.contact.deleteMany({ where: { orgId } });
  await db.company.deleteMany({ where: { orgId } });

  const company = await db.company.create({ data: { orgId, name: 'Meridian Systems', industry: 'Software' } });
  const acmeContact = await db.contact.create({ data: { orgId, companyId: company.id, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@meridian.io' } });

  await db.lead.createMany({
    data: [
      { orgId, contactId: acmeContact.id, source: 'Website', status: 'NEW', value: 25000 },
      { orgId, source: 'Referral', status: 'CONTACTED', value: 40000 },
      { orgId, source: 'Conference', status: 'QUALIFIED', value: 15000 },
    ],
  });

  const dealIds = await Promise.all([
    db.deal.create({ data: { orgId, name: 'Enterprise License', companyId: company.id, value: 120000, stage: 'QUALIFIED', probability: 40 } }),
    db.deal.create({ data: { orgId, name: 'Support Renewal', companyId: company.id, value: 30000, stage: 'NEGOTIATION', probability: 70 } }),
    db.deal.create({ data: { orgId, name: 'Onboarding Project', value: 18000, stage: 'WON', probability: 100 } }),
  ]);

  await db.activity.create({
    data: { orgId, userId: acmeContact.id, type: 'CALL', subject: 'Intro call', entityType: 'deal', entityId: dealIds[0]?.id },
  });

  await db.project.create({ data: { orgId, name: 'Website Redesign', status: 'ACTIVE' } });
  const proj = await db.project.create({ data: { orgId, name: 'ERP Migration', description: 'Platform migration', status: 'PLANNING' } });
  await db.task.createMany({
    data: [
      { orgId, projectId: proj.id, title: 'Audit current state', status: 'IN_PROGRESS', priority: 'HIGH' },
      { orgId, projectId: proj.id, title: 'Data cleanup', status: 'TODO', priority: 'MEDIUM' },
    ],
  });
  await db.milestone.create({ data: { orgId, projectId: proj.id, title: 'Kickoff' } });

  const accountSeed = await db.account.createMany({
    data: [
      { orgId, name: 'Operating', type: 'ASSET' },
      { orgId, name: 'Revenue', type: 'REVENUE' },
      { orgId, name: 'Expenses', type: 'EXPENSE' },
    ],
  });

  await db.vendor.create({ data: { orgId, name: 'Cloud Hosting Co', email: 'billing@cloud.example' } });

  await db.expense.createMany({
    data: [
      { orgId, category: 'Hosting', amount: 1200, date: new Date('2026-05-01') },
      { orgId, category: 'Software', amount: 800, date: new Date('2026-05-10') },
      { orgId, category: 'Marketing', amount: 2000, date: new Date('2026-06-02') },
    ],
  });

  const inv = await db.invoice.create({
    data: { orgId, number: 'INV-2026-001', companyId: company.id, status: 'SENT', total: 5000, paidAmount: 0 },
  });
  await db.invoiceItem.create({ data: { orgId, invoiceId: inv.id, description: 'Implementation', qty: 5, unitPrice: 1000, lineTotal: 5000 } });
  await db.payment.create({ data: { orgId, invoiceId: inv.id, amount: 5000, method: 'BANK_TRANSFER' } });
  await db.invoice.update({ where: { id: inv.id }, data: { status: 'PAID', paidAmount: 5000 } });

  return { c: await db.company.count({ where: { orgId } }), acc: accountSeed.count };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => migrateClient.$disconnect());
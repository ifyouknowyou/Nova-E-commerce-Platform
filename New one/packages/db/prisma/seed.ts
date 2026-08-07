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
  ADMIN: ['iam.*', 'org.*', 'settings.*', 'audit.read'],
  MANAGER: ['iam.roles.read', 'iam.members.read', 'org.read', 'settings.read', 'audit.read'],
  SALES: ['org.read', 'iam.members.read'],
  FINANCE: ['org.read'],
  OPERATIONS: ['org.read', 'audit.read'],
  HR: ['org.read', 'iam.members.read'],
  SUPPORT: ['org.read'],
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

  console.log(
    `Seeded: ${PERMISSION_SPECS.length} permissions, 8 roles x 2 orgs, policy settings, webhook connector.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => migrateClient.$disconnect());
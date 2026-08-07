-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'OPERATIONS', 'HR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'EXECUTE', 'MANAGE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SettingScope" AS ENUM ('ORGANIZATION', 'PERSONAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'EXECUTE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_roles" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "ip" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "scope" "SettingScope" NOT NULL DEFAULT 'ORGANIZATION',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "meta" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organization_members_org_id_idx" ON "organization_members"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_org_id_user_id_key" ON "organization_members"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "roles_org_id_idx" ON "roles"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_org_id_code_key" ON "roles"("org_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "membership_roles_member_id_idx" ON "membership_roles"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_roles_member_id_role_id_key" ON "membership_roles"("member_id", "role_id");

-- CreateIndex
CREATE INDEX "sessions_org_id_user_id_idx" ON "sessions"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "sessions_org_id_idx" ON "sessions"("org_id");

-- CreateIndex
CREATE INDEX "settings_org_id_idx" ON "settings"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_org_id_key_key" ON "settings"("org_id", "key");

-- CreateIndex
CREATE INDEX "audit_logs_org_id_entity_entity_id_idx" ON "audit_logs"("org_id", "entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_org_id_createdAt_idx" ON "audit_logs"("org_id", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_org_id_user_id_idx" ON "notifications"("org_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_org_id_idx" ON "api_keys"("org_id");

-- =====================================================================
-- NEXUS OS — Row-Level Security (upgrade Decision 1)
-- Runtime role: nexus_app (NOBYPASSRLS). Migrator: nexus_migrate (BYPASSRLS).
-- Tenant context: SELECT set_config('app.org', <org_id>, true) per request.
-- current_setting('app.org', true) => NULL when unset => policy fails closed.
-- =====================================================================

-- GRANTS for the API runtime role (per-table DML so RLS is honored).
GRANT SELECT, INSERT, UPDATE, DELETE ON "organization_members" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "roles" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "permissions" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "role_permissions" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "membership_roles" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "sessions" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "settings" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "audit_logs" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "notifications" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "api_keys" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "users" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "organizations" TO nexus_app;

-- ---- organization_members: org-scoped + self-read for sign-in --------------
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "organization_members"
  USING (org_id = current_setting('app.org', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org', true)::uuid);
CREATE POLICY self_read_memberships ON "organization_members"
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- ---- roles ----------------------------------------------------------------
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "roles"
  USING (org_id = current_setting('app.org', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org', true)::uuid);

-- ---- permissions (global catalogue, readable by any tenant session) ---------
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissions_read_all ON "permissions"
  FOR SELECT
  USING (current_setting('app.org', true) IS NOT NULL AND length(current_setting('app.org', true)) > 0);

-- ---- role_permissions -------------------------------------------------------
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_perm_org ON "role_permissions"
  USING (EXISTS (
    SELECT 1 FROM "roles" r
    WHERE r.id = role_id AND r.org_id = current_setting('app.org', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "roles" r
    WHERE r.id = role_id AND r.org_id = current_setting('app.org', true)::uuid
  ));

-- ---- membership_roles -------------------------------------------------------
ALTER TABLE "membership_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY membership_role_org ON "membership_roles"
  USING (EXISTS (
    SELECT 1 FROM "roles" r
    WHERE r.id = role_id AND r.org_id = current_setting('app.org', true)::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "roles" r
    WHERE r.id = role_id AND r.org_id = current_setting('app.org', true)::uuid
  ));

-- ---- sessions, settings, audit_logs, notifications, api_keys -------------
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "sessions"
  USING (org_id = current_setting('app.org', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org', true)::uuid);

ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "settings"
  USING (org_id = current_setting('app.org', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org', true)::uuid);

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "audit_logs"
  USING (org_id = current_setting('app.org', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org', true)::uuid);

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "notifications"
  USING (org_id = current_setting('app.org', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org', true)::uuid);

ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "api_keys"
  USING (org_id = current_setting('app.org', true)::uuid)
  WITH CHECK (org_id = current_setting('app.org', true)::uuid);

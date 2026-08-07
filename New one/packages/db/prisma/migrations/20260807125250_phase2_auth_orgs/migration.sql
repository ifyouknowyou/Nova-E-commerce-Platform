-- CreateEnum
CREATE TYPE "VerificationTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'INVITE_ACCEPT');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('SIGNUP', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'EMAIL_VERIFIED', 'SESSION_REVOKED', 'INVITE_SENT', 'INVITE_ACCEPTED', 'ORG_SWITCHED', 'INTEGRATION_TESTED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('WEBHOOK');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "last_login_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "VerificationTokenType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID,
    "type" "SecurityEventType" NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role_code" "RoleCode" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by_id" UUID,
    "accepted_by_id" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_tested_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_idx" ON "verification_tokens"("user_id");

-- CreateIndex
CREATE INDEX "security_events_org_id_createdAt_idx" ON "security_events"("org_id", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_org_id_user_id_idx" ON "security_events"("org_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_org_id_idx" ON "invitations"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_org_id_email_key" ON "invitations"("org_id", "email");

-- CreateIndex
CREATE INDEX "integrations_org_id_idx" ON "integrations"("org_id");

-- =====================================================================
-- NEXUS OS — Phase 2 RLS (Row-Level Security) for new tenant tables.
-- Same pattern as 01_init: grants for nexus_app + org-isolation policy.
-- =====================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "security_events" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "invitations" TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "integrations" TO nexus_app;

ALTER TABLE "security_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "security_events"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "invitations"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "integrations"
  USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
  WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

-- Verification tokens are USER-scoped, not org-scoped: a user can read/use
-- their own verification tokens via the app.user_id self-scope policy.
GRANT SELECT, INSERT, UPDATE, DELETE ON "verification_tokens" TO nexus_app;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
CREATE POLICY self_own_tokens ON "verification_tokens"
  USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

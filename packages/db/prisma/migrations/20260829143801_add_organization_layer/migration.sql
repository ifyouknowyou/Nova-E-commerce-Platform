-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoKey" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleCodes" TEXT[],
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_status_idx" ON "OrganizationMembership"("userId", "status");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_status_idx" ON "OrganizationMembership"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Store_organizationId_idx" ON "Store"("organizationId");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill: every existing store becomes its own organization owned by the
-- store's seller, and that seller gets an ACTIVE owner membership. Store and
-- seller flows keep working because sellerId is preserved and organizationId
-- is now set. Safe to re-run (guards on existing org/membership).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  s RECORD;
  org_id TEXT;
  slug_base TEXT;
  slug_final TEXT;
  n INT;
BEGIN
  FOR s IN SELECT id, "sellerId", name, slug FROM "Store" WHERE "organizationId" IS NULL LOOP
    slug_base := lower(regexp_replace(s.slug, '[^a-z0-9]+', '-', 'g'));
    slug_final := slug_base;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM "Organization" WHERE slug = slug_final) LOOP
      n := n + 1;
      slug_final := slug_base || '-' || n;
    END LOOP;

    INSERT INTO "Organization" (id, "ownerId", name, slug, status, plan, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), s."sellerId", s.name, slug_final, 'ACTIVE', 'starter', now(), now())
    RETURNING id INTO org_id;

    UPDATE "Store" SET "organizationId" = org_id WHERE id = s.id;

    INSERT INTO "OrganizationMembership" ("id", "organizationId", "userId", "roleCodes", status, "invitedBy", "joinedAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), org_id, s."sellerId", ARRAY['ORG_OWNER'], 'ACTIVE', s."sellerId", now(), now(), now())
    ON CONFLICT ("organizationId", "userId") DO NOTHING;
  END LOOP;
END $$;

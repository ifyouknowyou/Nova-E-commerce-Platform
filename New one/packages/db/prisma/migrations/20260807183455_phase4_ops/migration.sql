-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category_id" UUID,
ADD COLUMN     "reorder_level" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_levels" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID,
    "type" "StockMovementType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "note" TEXT,
    "created_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "customer_id" UUID,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_to_id" UUID,
    "created_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID,
    "body" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID,
    "department_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "hire_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_folders" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "folder_id" UUID,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "owner_id" UUID,
    "tags" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "created_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_categories_org_id_idx" ON "product_categories"("org_id");

-- CreateIndex
CREATE INDEX "suppliers_org_id_idx" ON "suppliers"("org_id");

-- CreateIndex
CREATE INDEX "warehouses_org_id_idx" ON "warehouses"("org_id");

-- CreateIndex
CREATE INDEX "stock_locations_org_id_idx" ON "stock_locations"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_warehouse_id_name_key" ON "stock_locations"("warehouse_id", "name");

-- CreateIndex
CREATE INDEX "stock_levels_org_id_idx" ON "stock_levels"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_levels_product_id_location_id_key" ON "stock_levels"("product_id", "location_id");

-- CreateIndex
CREATE INDEX "stock_movements_org_id_product_id_idx" ON "stock_movements"("org_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_movements_org_id_createdAt_idx" ON "stock_movements"("org_id", "createdAt");

-- CreateIndex
CREATE INDEX "tickets_org_id_idx" ON "tickets"("org_id");

-- CreateIndex
CREATE INDEX "ticket_comments_org_id_ticket_id_idx" ON "ticket_comments"("org_id", "ticket_id");

-- CreateIndex
CREATE INDEX "departments_org_id_idx" ON "departments"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_org_id_name_key" ON "departments"("org_id", "name");

-- CreateIndex
CREATE INDEX "employees_org_id_idx" ON "employees"("org_id");

-- CreateIndex
CREATE INDEX "document_folders_org_id_idx" ON "document_folders"("org_id");

-- CreateIndex
CREATE INDEX "documents_org_id_idx" ON "documents"("org_id");

-- CreateIndex
CREATE INDEX "document_versions_org_id_idx" ON "document_versions"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_document_id_version_key" ON "document_versions"("document_id", "version");
-- Phase4 RLS (all tenant-scoped).
GRANT SELECT, INSERT, UPDATE, DELETE ON "product_categories" TO nexus_app;
ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "product_categories" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "suppliers" TO nexus_app;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "suppliers" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "warehouses" TO nexus_app;
ALTER TABLE "warehouses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "warehouses" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "stock_locations" TO nexus_app;
ALTER TABLE "stock_locations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "stock_locations" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "stock_levels" TO nexus_app;
ALTER TABLE "stock_levels" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "stock_levels" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "stock_movements" TO nexus_app;
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "stock_movements" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "tickets" TO nexus_app;
ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "tickets" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "ticket_comments" TO nexus_app;
ALTER TABLE "ticket_comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "ticket_comments" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "departments" TO nexus_app;
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "departments" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "employees" TO nexus_app;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "employees" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "document_folders" TO nexus_app;
ALTER TABLE "document_folders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "document_folders" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "documents" TO nexus_app;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "documents" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "document_versions" TO nexus_app;
ALTER TABLE "document_versions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "document_versions" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, UPDATE ON "products" TO nexus_app;

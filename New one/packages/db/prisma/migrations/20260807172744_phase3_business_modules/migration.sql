-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE', 'EQUITY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'CASH', 'OTHER');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "company_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "company_id" UUID,
    "contact_id" UUID,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "value" DECIMAL(12,2),
    "owner_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "company_id" UUID,
    "contact_id" UUID,
    "value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stage" "DealStage" NOT NULL DEFAULT 'NEW',
    "probability" INTEGER NOT NULL DEFAULT 10,
    "expected_close_date" TIMESTAMP(3),
    "owner_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID,
    "type" "ActivityType" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "entity_type" TEXT,
    "entity_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "author_id" UUID,
    "body" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "contact_id" UUID,
    "company_id" UUID,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "valid_until" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issued_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "product_id" UUID,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_targets" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "owner_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "project_id" UUID,
    "milestone_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" TIMESTAMP(3),
    "assignee_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "author_id" UUID,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "account_id" UUID,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "company_id" UUID,
    "contact_id" UUID,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issued_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "vendor_id" UUID,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_org_id_idx" ON "companies"("org_id");

-- CreateIndex
CREATE INDEX "contacts_org_id_idx" ON "contacts"("org_id");

-- CreateIndex
CREATE INDEX "leads_org_id_idx" ON "leads"("org_id");

-- CreateIndex
CREATE INDEX "deals_org_id_idx" ON "deals"("org_id");

-- CreateIndex
CREATE INDEX "activities_org_id_idx" ON "activities"("org_id");

-- CreateIndex
CREATE INDEX "notes_org_id_idx" ON "notes"("org_id");

-- CreateIndex
CREATE INDEX "products_org_id_idx" ON "products"("org_id");

-- CreateIndex
CREATE INDEX "quotes_org_id_idx" ON "quotes"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_org_id_number_key" ON "quotes"("org_id", "number");

-- CreateIndex
CREATE INDEX "quote_items_org_id_quote_id_idx" ON "quote_items"("org_id", "quote_id");

-- CreateIndex
CREATE INDEX "sales_targets_org_id_idx" ON "sales_targets"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_targets_org_id_period_key" ON "sales_targets"("org_id", "period");

-- CreateIndex
CREATE INDEX "projects_org_id_idx" ON "projects"("org_id");

-- CreateIndex
CREATE INDEX "project_members_org_id_idx" ON "project_members"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "tasks_org_id_idx" ON "tasks"("org_id");

-- CreateIndex
CREATE INDEX "milestones_org_id_project_id_idx" ON "milestones"("org_id", "project_id");

-- CreateIndex
CREATE INDEX "task_comments_org_id_task_id_idx" ON "task_comments"("org_id", "task_id");

-- CreateIndex
CREATE INDEX "accounts_org_id_idx" ON "accounts"("org_id");

-- CreateIndex
CREATE INDEX "transactions_org_id_idx" ON "transactions"("org_id");

-- CreateIndex
CREATE INDEX "invoices_org_id_idx" ON "invoices"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_org_id_number_key" ON "invoices"("org_id", "number");

-- CreateIndex
CREATE INDEX "invoice_items_org_id_invoice_id_idx" ON "invoice_items"("org_id", "invoice_id");

-- CreateIndex
CREATE INDEX "payments_org_id_invoice_id_idx" ON "payments"("org_id", "invoice_id");

-- CreateIndex
CREATE INDEX "expenses_org_id_idx" ON "expenses"("org_id");

-- CreateIndex
CREATE INDEX "vendors_org_id_idx" ON "vendors"("org_id");
-- RLS for Phase 3 business tables (all tenant-scoped).
GRANT SELECT, INSERT, UPDATE, DELETE ON "companies" TO nexus_app;
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "companies" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "contacts" TO nexus_app;
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "contacts" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "leads" TO nexus_app;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "leads" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "deals" TO nexus_app;
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "deals" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "activities" TO nexus_app;
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "activities" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "notes" TO nexus_app;
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "notes" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "products" TO nexus_app;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "products" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "quotes" TO nexus_app;
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "quotes" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "quote_items" TO nexus_app;
ALTER TABLE "quote_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "quote_items" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "sales_targets" TO nexus_app;
ALTER TABLE "sales_targets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "sales_targets" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "projects" TO nexus_app;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "projects" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "project_members" TO nexus_app;
ALTER TABLE "project_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "project_members" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "tasks" TO nexus_app;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "tasks" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "milestones" TO nexus_app;
ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "milestones" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "task_comments" TO nexus_app;
ALTER TABLE "task_comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "task_comments" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "accounts" TO nexus_app;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "accounts" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "transactions" TO nexus_app;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "transactions" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "invoices" TO nexus_app;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "invoices" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "invoice_items" TO nexus_app;
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "invoice_items" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "payments" TO nexus_app;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "payments" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "expenses" TO nexus_app;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "expenses" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "vendors" TO nexus_app;
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "vendors" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);

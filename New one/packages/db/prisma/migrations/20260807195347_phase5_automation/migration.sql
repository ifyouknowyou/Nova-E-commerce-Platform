-- CreateEnum
CREATE TYPE "WorkflowTriggerType" AS ENUM ('DEAL_WON', 'INVENTORY_LOW', 'STATUS_CHANGED', 'RECORD_CREATED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "workflows" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger_type" "WorkflowTriggerType" NOT NULL,
    "trigger_config" JSONB NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "created_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "status" "WorkflowExecutionStatus" NOT NULL,
    "trigger_type" "WorkflowTriggerType" NOT NULL,
    "summary" JSONB NOT NULL,
    "error" TEXT,
    "triggered_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_records" (
    "id" UUID NOT NULL,
    "org_id" UUID,
    "code" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "request_method" TEXT,
    "request_url" TEXT,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_events" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflows_org_id_idx" ON "workflows"("org_id");

-- CreateIndex
CREATE INDEX "workflow_executions_org_id_workflow_id_idx" ON "workflow_executions"("org_id", "workflow_id");

-- CreateIndex
CREATE INDEX "workflow_executions_org_id_createdAt_idx" ON "workflow_executions"("org_id", "createdAt");

-- CreateIndex
CREATE INDEX "error_records_org_id_createdAt_idx" ON "error_records"("org_id", "createdAt");

-- CreateIndex
CREATE INDEX "metric_events_org_id_name_idx" ON "metric_events"("org_id", "name");
-- Phase5 RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON "workflows" TO nexus_app;
ALTER TABLE "workflows" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "workflows" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "workflow_executions" TO nexus_app;
ALTER TABLE "workflow_executions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "workflow_executions" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "metric_events" TO nexus_app;
ALTER TABLE "metric_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "metric_events" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "error_records" TO nexus_app;
ALTER TABLE "error_records" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_scope_all ON "error_records" USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid OR org_id IS NULL) WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid OR org_id IS NULL);

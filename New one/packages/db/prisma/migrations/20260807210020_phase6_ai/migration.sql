-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'AGENT', 'TOOL');

-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('RUNNING', 'NEEDS_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EDITED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AiApprovalSource" AS ENUM ('TOOL_CALL', 'AGENT_RUN');

-- CreateEnum
CREATE TYPE "AiToolRisk" AS ENUM ('READ', 'LOW', 'HIGH', 'SENSITIVE');

-- CreateEnum
CREATE TYPE "AiToolCallStatus" AS ENUM ('PROPOSED', 'EXECUTED', 'NEEDS_APPROVAL', 'APPROVED', 'DENIED', 'ABORTED');

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_messages" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "evidence" JSONB,
    "records" JSONB,
    "tool_calls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tool_call_logs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "conversation_id" UUID,
    "source" "AiMessageRole" NOT NULL,
    "tool_name" TEXT NOT NULL,
    "risk" "AiToolRisk" NOT NULL,
    "status" "AiToolCallStatus" NOT NULL,
    "input" JSONB NOT NULL,
    "result" JSONB,
    "actor_id" UUID,
    "permission_code" TEXT,
    "approval_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_tool_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_runs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "agent_key" TEXT NOT NULL,
    "status" "AiRunStatus" NOT NULL,
    "brief" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "created_by_id" UUID,
    "approval_id" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_approval_requests" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "source" "AiApprovalSource" NOT NULL,
    "status" "AiApprovalStatus" NOT NULL,
    "target_key" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "input" JSONB,
    "result" JSONB,
    "requested_by_id" UUID,
    "approvable_by" UUID,
    "decided_by_id" UUID,
    "decision" TEXT,
    "edit_input" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "escalated_at" TIMESTAMP(3),
    "escalation_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "ai_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_conversations_org_id_user_id_idx" ON "ai_conversations"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "ai_chat_messages_org_id_conversation_id_idx" ON "ai_chat_messages"("org_id", "conversation_id");

-- CreateIndex
CREATE INDEX "ai_tool_call_logs_org_id_createdAt_idx" ON "ai_tool_call_logs"("org_id", "createdAt");

-- CreateIndex
CREATE INDEX "ai_agent_runs_org_id_startedAt_idx" ON "ai_agent_runs"("org_id", "startedAt");

-- CreateIndex
CREATE INDEX "ai_approval_requests_org_id_status_idx" ON "ai_approval_requests"("org_id", "status");

-- CreateIndex
CREATE INDEX "ai_approval_requests_org_id_createdAt_idx" ON "ai_approval_requests"("org_id", "createdAt");

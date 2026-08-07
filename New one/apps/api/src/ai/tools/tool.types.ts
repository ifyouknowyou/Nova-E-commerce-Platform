import type { AiToolRisk } from '@nexus/shared';
import type { LlmToolDef } from '../provider/llm.provider';

/** Execution context passed to every tool handler. */
export interface AiToolContext {
  orgId: string;
  actorId?: string;
}

/** A tool's real, auditable outcome — feeds the LLM answer and the audit trail. */
export interface AiToolResult {
  summary: string;
  records?: unknown[];
  total?: number;
  label?: string;
}

export type AiToolHandler = (
  ctx: AiToolContext,
  input: Record<string, unknown>,
) => Promise<AiToolResult>;

export interface AiToolDef {
  name: string;
  description: string;
  keywords: string[];
  /** READ/LOW execute freely within RBAC; HIGH/SENSITIVE require an approval. */
  risk: AiToolRisk;
  /** Permission code the caller must hold to invoke the tool. */
  permission: string;
  inputSchema: Record<string, unknown>;
  handler: AiToolHandler;
}

/** Result of running a tool through the safety gate. */
export type AiToolOutcome =
  | { status: 'executed'; result: AiToolResult }
  | { status: 'requires_approval'; approvalId: string }
  | { status: 'denied_permission' };

/** Map a registered tool to the provider's catalogue shape (no handler). */
export function toLlmToolDef(tool: AiToolDef): LlmToolDef {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    keywords: tool.keywords,
  };
}

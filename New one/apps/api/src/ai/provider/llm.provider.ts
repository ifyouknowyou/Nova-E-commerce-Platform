/**
 * Phase 6 — LLM provider abstraction.
 *
 * The Copilot/Agents talk to THIS interface, never to a vendor SDK directly.
 * Two implementations exist:
 *   * ClaudeProvider  — real LLM via @anthropic-ai/sdk (used when a key is set)
 *   * DeterministicProvider — local engine that routes a question to a real
 *     tool and answers from the real result. Never canned. Used when no key is
 *     configured and in automated tests.
 *
 * The provider is deliberately single-shot: it returns either a final answer
 * or ONE tool call. The orchestrator (Copilot/Agent) owns the agentic loop,
 * feeds tool results back, and — critically — every tool call passes through
 * the ToolRunner gate, so high-risk calls never execute without approval
 * regardless of which provider is in use.
 */

export interface LlmToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Keyword hints for the deterministic router (not sent to the LLM). */
  keywords?: string[];
}

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmResult {
  /** Final answer text. Present when the model is done calling tools. */
  text?: string;
  /** The model wants to call exactly one tool. */
  toolCall?: { name: string; input: Record<string, unknown> };
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmProvider {
  complete(opts: {
    system?: string;
    messages: LlmMessage[];
    tools?: LlmToolDef[];
  }): Promise<LlmResult>;
}

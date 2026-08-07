import { Injectable } from '@nestjs/common';
import type { LlmMessage, LlmProvider, LlmResult, LlmToolDef } from './llm.provider';

/**
 * Deterministic engine — the offline / test provider.
 *
 * It never invents data. Two behaviours:
 *   1. A fresh user question → keyword-routes to the single best-matching tool
 *      in the supplied catalogue (same catalogue the LLM would see). The caller
 *      then executes that tool against real tenant data via the ToolRunner.
 *   2. A tool result (a user message carrying the [TOOL_RESULT] JSON marker) →
 *      produces a concise grounded answer derived from the actual returned data.
 *
 * Because it routes through the exact same tool catalogue + runner as the LLM,
 * it exercises the identical permission/risk/approval path in tests — a
 * sensitive tool call still becomes an approval request, never an execution.
 */

const RESULT_MARKER = '[TOOL_RESULT]';

@Injectable()
export class DeterministicProvider implements LlmProvider {
  async complete(opts: {
    system?: string;
    messages: LlmMessage[];
    tools?: LlmToolDef[];
  }): Promise<LlmResult> {
    const last = opts.messages[opts.messages.length - 1];
    if (!last) return { text: "I don't have enough context to answer yet." };

    // 1) A tool result is in hand → summarize the real data.
    const result = extractResult(last);
    if (result) return { text: summarizeResult(result) };

    // 2) Otherwise route the question to the best tool.
    const question = last.content.toLowerCase();
    const tool = pickTool(opts.tools ?? [], question);
    if (tool) {
      return { toolCall: { name: tool.name, input: inferInput(tool, question) } };
    }

    return {
      text: "I couldn't map that question to one of my available actions. Try asking about sales, deals, customers, invoices, inventory, projects, or support tickets.",
    };
  }
}

export function extractResult(msg: LlmMessage): Record<string, unknown> | undefined {
  const idx = msg.content.indexOf(RESULT_MARKER);
  if (idx === -1) return undefined;
  try {
    const parsed = JSON.parse(msg.content.slice(idx + RESULT_MARKER.length).trim()) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/** Natural-language summary of a real tool result. */
function summarizeResult(result: Record<string, unknown>): string {
  const summary = result.summary;
  if (typeof summary === 'string') return summary;
  const items = Array.isArray(result.items) ? result.items : [];
  const total = typeof result.total === 'number' ? result.total : items.length;
  if (typeof result.label === 'string') {
    const names = items.slice(0, 5).map((it) => labelOf(it)).filter(Boolean).join(', ');
    return `${result.label}: ${total}${names ? ` — ${names}` : ''}.`;
  }
  return `Found ${total} matching record${total === 1 ? '' : 's'}${items.length ? ` (${items.slice(0, 5).map((it) => labelOf(it)).filter(Boolean).join(', ')})` : ''}.`;
}

function labelOf(it: unknown): string {
  if (!it || typeof it !== 'object') return String(it ?? '');
  const o = it as Record<string, unknown>;
  const key = ['name', 'title', 'subject', 'number', 'label'].find((k) => typeof o[k] === 'string');
  return key ? String(o[key]) : '';
}

function pickTool(tools: LlmToolDef[], question: string): LlmToolDef | undefined {
  const scored = tools
    .map((t) => ({ tool: t, score: scoreTool(t, question) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.tool;
}

function scoreTool(tool: LlmToolDef, question: string): number {
  const keys: string[] = [
    tool.name,
    ...(tool.keywords ?? []),
    ...tool.description.toLowerCase().split(/\W+/),
  ];
  let score = 0;
  for (const token of keys) {
    if (token.length > 3 && question.includes(token.toLowerCase())) score += token.length;
  }
  return score;
}

function inferInput(tool: LlmToolDef, question: string): Record<string, unknown> {
  // Best-effort extraction for the common scalar params. Real services also
  // validate + reject bad input, so a wrong guess is safe (a read tool errors
  // or returns empty, never misacts).
  const input: Record<string, unknown> = {};
  const props = (tool.inputSchema.properties ?? {}) as Record<string, unknown>;
  for (const [key, prop] of Object.entries(props)) {
    const p = prop as { type?: string; enum?: string[] };
    if (p.enum?.length) {
      const hit = p.enum.find((e) => question.includes(e.toLowerCase()));
      if (hit) input[key] = hit;
      continue;
    }
    if (p.type === 'integer' || p.type === 'number') {
      const m = question.match(/\d+/);
      if (m) input[key] = Number(m[0]);
      continue;
    }
    if (p.type === 'boolean') {
      if (/\b(active|open|pending)\b/.test(question)) input[key] = true;
      continue;
    }
    if (p.type === 'string') {
      // default: leave optional strings blank; the tool resolves by search term.
    }
  }
  return input;
}

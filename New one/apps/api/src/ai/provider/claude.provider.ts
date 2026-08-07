import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type { LlmMessage, LlmProvider, LlmResult, LlmToolDef } from './llm.provider';

/**
 * Claude-backed provider (@anthropic-ai/sdk). Single-shot complete(): sends the
 * messages + optional tool catalogue and returns either a final text answer or
 * a single tool call request. The orchestrator runs the tool through the
 * ToolRunner gate and feeds results back — the provider never executes tools.
 *
 * Model + params follow the current Claude API surface: claude-opus-5,
 * adaptive thinking, no sampling params, max 2 turns worth of headroom.
 */
@Injectable()
export class ClaudeProvider implements LlmProvider {
  private readonly logger = new Logger(ClaudeProvider.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(opts: {
    system?: string;
    messages: LlmMessage[];
    tools?: LlmToolDef[];
  }): Promise<LlmResult> {
    const tools = opts.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: opts.system,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      ...(tools && tools.length > 0 ? { tools } : {}),
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (toolUse) {
      return {
        toolCall: { name: toolUse.name, input: toolUse.input as Record<string, unknown> },
      };
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!text) {
      this.logger.warn(`Claude returned no text/tool_use (stop=${response.stop_reason})`);
    }
    return { text };
  }
}

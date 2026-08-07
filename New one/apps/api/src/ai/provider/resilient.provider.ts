import { Logger } from '@nestjs/common';
import type { LlmMessage, LlmProvider, LlmResult, LlmToolDef } from './llm.provider';

/**
 * Wraps the primary LLM provider (e.g. Claude) with the deterministic local
 * engine as a fallback. If the external API errors (billing, quota, network,
 * timeout), the Copilot/Agent degrades gracefully to the grounded local engine
 * instead of surfacing a 500. Read-through for deterministic is a no-op.
 */
export class ResilientProvider implements LlmProvider {
  private readonly logger = new Logger(ResilientProvider.name);

  constructor(
    private readonly primary: LlmProvider,
    private readonly fallback: LlmProvider,
  ) {}

  async complete(opts: {
    system?: string;
    messages: LlmMessage[];
    tools?: LlmToolDef[];
  }): Promise<LlmResult> {
    try {
      return await this.primary.complete(opts);
    } catch (err) {
      this.logger.warn(`LLM provider failed (${(err as Error).message}); falling back to deterministic engine`);
      return this.fallback.complete(opts);
    }
  }
}

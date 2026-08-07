import { Injectable } from '@nestjs/common';
import { ClaudeProvider } from './claude.provider';
import { DeterministicProvider } from './deterministic.provider';
import { LlmProvider } from './llm.provider';

/**
 * Chooses the active LLM provider:
 *   * Claude-backed when ANTHROPIC_API_KEY is set,
 *   * deterministic local engine otherwise (offline / tests).
 */
@Injectable()
export class LlmProviderFactory {
  constructor(private readonly deterministic: DeterministicProvider) {}

  getProvider(apiKey: string | undefined, model: string): LlmProvider {
    if (apiKey && apiKey.trim().length > 0) {
      return new ClaudeProvider(apiKey, model);
    }
    return this.deterministic;
  }
}

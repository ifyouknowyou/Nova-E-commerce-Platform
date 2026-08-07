import { Injectable } from '@nestjs/common';
import { ClaudeProvider } from './claude.provider';
import { DeterministicProvider } from './deterministic.provider';
import { LlmProvider } from './llm.provider';
import { ResilientProvider } from './resilient.provider';

/**
 * Chooses the active LLM provider:
 *   * Claude-backed when ANTHROPIC_API_KEY is set, wrapped in ResilientProvider
 *     so any external failure (billing, quota, network) falls back to the
 *     deterministic engine rather than erroring mid-answer.
 *   * deterministic local engine otherwise (offline / tests — never fails).
 */
@Injectable()
export class LlmProviderFactory {
  constructor(private readonly deterministic: DeterministicProvider) {}

  getProvider(apiKey: string | undefined, model: string): LlmProvider {
    if (apiKey && apiKey.trim().length > 0) {
      return new ResilientProvider(new ClaudeProvider(apiKey, model), this.deterministic);
    }
    return this.deterministic;
  }
}

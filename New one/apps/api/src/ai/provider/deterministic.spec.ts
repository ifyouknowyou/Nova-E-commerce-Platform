import { DeterministicProvider, extractResult } from './deterministic.provider';

const provider = new DeterministicProvider();

describe('DeterministicProvider — offline / test engine', () => {
  it('routes a sales question to getSalesSummary', async () => {
    const res = await provider.complete({
      messages: [{ role: 'user', content: 'How did sales perform this month?' }],
      tools: [{ name: 'getSalesSummary', description: 'Summarize sales performance and revenue.', inputSchema: {} }],
    });
    expect(res.toolCall?.name).toBe('getSalesSummary');
  });

  it('routes an inventory question to a stock tool', async () => {
    const res = await provider.complete({
      messages: [{ role: 'user', content: 'Do we have low stock alerts?' }],
      tools: [{ name: 'getInventoryStatus', description: 'Get current stock levels and reorder alerts.', inputSchema: {} }],
    });
    expect(res.toolCall?.name).toBe('getInventoryStatus');
  });

  it('answers from the real tool result (never canned)', async () => {
    const res = await provider.complete({
      messages: [{ role: 'user', content: '[TOOL_RESULT] {"summary":"Sales: 3 open deals (1200 pipeline).","items":[],"total":3}' }],
      tools: [],
    });
    expect(res.text).toContain('3 open deals');
    expect(res.text).toContain('1200');
  });

  it('maps an unknown question back to the catalogue when nothing matches', async () => {
    const res = await provider.complete({
      messages: [{ role: 'user', content: 'What is the meaning of life?' }],
      tools: [{ name: 'getSalesSummary', description: 'Summarize sales performance.', inputSchema: {} }],
    });
    // Fails safe: no tool, a text answer (never an invented tool).
    expect(res.text).toBeTruthy();
    expect(res.toolCall?.name).not.toBe('getSalesSummary');
  });

  it('extracts the real tool result from a [TOOL_RESULT] message', () => {
    expect(extractResult({ role: 'user', content: '[TOOL_RESULT] {"total": 7}' })).toEqual({ total: 7 });
    expect(extractResult({ role: 'user', content: 'plain question' })).toBeUndefined();
  });
});
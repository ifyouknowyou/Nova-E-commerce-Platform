import type { BusinessGraph } from './business-graph.service';

/**
 * ONE AI context — a compact, tenant-scoped summary of the Business Graph plus
 * the caller's effective permissions. This is what the Copilot/Agents reason
 * over; it is built entirely from RLS-scoped rows, so cross-tenant data never
 * enters a prompt.
 */
export function businessGraphContext(graph: BusinessGraph, permissions: string[]): string {
  const lines: string[] = [
    'You are the NEXUS OS business copilot. Answer ONLY from the business context below and from tool results you retrieve.',
    'Never invent business data, revenue figures, or record counts. If a figure is not in context or in a tool result, say so.',
    '',
    '## Business context (your tenant)',
  ];

  const byType = new Map<string, { label: string; meta: Record<string, unknown> }[]>();
  for (const n of graph.nodes) {
    const arr = byType.get(n.type) ?? [];
    arr.push({ label: n.label, meta: n.meta ?? {} });
    byType.set(n.type, arr);
  }

  for (const [type, nodes] of byType) {
    const preview = nodes.slice(0, 25).map((n) => {
      const meta = Object.entries(n.meta)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      return meta ? `${n.label} (${meta})` : n.label;
    });
    lines.push(`- ${type}s: ${nodes.length} total${preview.length ? ` — ${preview.join('; ')}` : ''}`);
  }

  lines.push('');
  lines.push(`## Your permissions: ${permissions.length ? permissions.join(', ') : '(read-only)'}`);
  lines.push('');
  lines.push('Use the tools to fetch live data when a question needs specifics not shown above.');
  return lines.join('\n');
}

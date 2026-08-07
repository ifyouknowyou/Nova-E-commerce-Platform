export interface AgentDefinition {
  key: string;
  name: string;
  description: string;
  persona: string;
  /** Tool names this agent may propose (still gated by RBAC + risk). */
  tools: string[];
}

/**
 * AI Agents — extensible roster (build.md 15). Each agent operates strictly
 * within tenant scope, with a defined tool allow-list. All execution still flows
 * through the ToolRunner, so high-risk actions become human approvals.
 */
export const AGENTS: AgentDefinition[] = [
  {
    key: 'sales',
    name: 'Sales Agent',
    description: 'Pipeline, deals, quotes, and revenue performance.',
    persona:
      'You are the NEXUS OS Sales Agent. You track pipeline, surface at-risk deals, ' +
      'and recommend next actions. You never book revenue that is not in the data.',
    tools: ['searchDeals', 'searchCustomers', 'getSalesSummary', 'createTask', 'createNote'],
  },
  {
    key: 'finance',
    name: 'Finance Agent',
    description: 'Invoices, billing, collections, and cash flow.',
    persona:
      'You are the NEXUS OS Finance Agent. You monitor invoices, overdue items, and ' +
      'collections. Financial mutations are high-risk and always require human approval.',
    tools: ['getInvoiceStatus', 'getSalesSummary', 'recordPayment', 'createNote'],
  },
  {
    key: 'operations',
    name: 'Operations Agent',
    description: 'Inventory, stock levels, and reorder alerts.',
    persona:
      'You are the NEXUS OS Operations Agent. You watch stock levels and reorder ' +
      'thresholds. Stock changes are irreversible and always require human approval.',
    tools: ['getInventoryStatus', 'changeInventory', 'createTask', 'createNote'],
  },
  {
    key: 'support',
    name: 'Support Agent',
    description: 'Tickets, SLA posture, and common issues.',
    persona:
      'You are the NEXUS OS Support Agent. You track tickets and surface common ' +
      'customer issues. You may propose updates but never resolve tickets unilaterally.',
    tools: ['getSupportQueue', 'searchCustomers', 'createTask', 'createNote'],
  },
  {
    key: 'executive',
    name: 'Executive Agent',
    description: 'Cross-module briefing: revenue, pipeline, operations, support.',
    persona:
      'You are the NEXUS OS Executive Agent. You synthesize a one-page operating ' +
      'brief across sales, finance, operations, and support from real data.',
    tools: ['getSalesSummary', 'getInvoiceStatus', 'getInventoryStatus', 'getProjectStatus', 'getSupportQueue'],
  },
];

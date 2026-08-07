/**
 * NEXUS OS — permission catalogue (authoritative for authorization).
 *
 * Upgrade Decision 3 (RBAC as data): the matrix is modelled as rows
 * (`Permission`, `RolePermission`) in the DB and seeded from this file. Roles
 * are edited by OWNER/ADMIN at runtime; changing a row here OR in the DB changes
 * authorization everywhere via the single reusable guard.
 *
 * Convention (matches the seed): permission code = `<entity>:<action>` and the
 * matrix is grouped by entity. These literals are consumed by:
 *   - the DB seed (packages/db/prisma/seed.ts)
 *   - the NestJS `@RequirePermissions` decorator (apps/api)
 *   - the web shell for declarative UI gating (read-only mirror).
 */

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'execute' | 'manage';

export interface PermissionSpec {
  /** Stable permission code, e.g. `iam.roles.create`. */
  code: string;
  /** Entity the permission applies to, e.g. `iam.roles`. */
  entity: string;
  action: PermissionAction;
  description: string;
}

/** Phase-1 scope. Higher modules add entities in later phases. */
export const PERMISSION_SPECS: readonly PermissionSpec[] = [
  // IAM (Phase 1 core)
  { code: 'iam.roles.read', entity: 'iam.roles', action: 'read', description: 'List roles in the organization.' },
  { code: 'iam.roles.create', entity: 'iam.roles', action: 'create', description: 'Create roles.' },
  { code: 'iam.roles.update', entity: 'iam.roles', action: 'update', description: 'Edit role permission sets.' },
  { code: 'iam.roles.delete', entity: 'iam.roles', action: 'delete', description: 'Delete roles.' },
  { code: 'iam.members.read', entity: 'iam.members', action: 'read', description: 'List organization members.' },
  { code: 'iam.members.invite', entity: 'iam.members', action: 'create', description: 'Invite members to the org.' },
  { code: 'iam.members.update', entity: 'iam.members', action: 'update', description: 'Update a member’s role/status.' },
  { code: 'iam.members.remove', entity: 'iam.members', action: 'delete', description: 'Remove members from the org.' },
  // Org
  { code: 'org.read', entity: 'org', action: 'read', description: 'Read the organization profile.' },
  { code: 'org.update', entity: 'org', action: 'manage', description: 'Update the organization profile.' },
  // Settings
  { code: 'settings.read', entity: 'settings', action: 'read', description: 'Read organization settings.' },
  { code: 'settings.update', entity: 'settings', action: 'update', description: 'Update organization settings.' },
  // Audit
  { code: 'audit.read', entity: 'audit', action: 'read', description: 'Read audit logs.' },
  // Dashboard / BI
  { code: 'dashboard.read', entity: 'dashboard', action: 'read', description: 'Read the executive dashboard.' },
  { code: 'analytics.read', entity: 'analytics', action: 'read', description: 'Read analytics / BI surfaces.' },
  // CRM
  { code: 'crm.company.read', entity: 'crm.company', action: 'read', description: 'Read companies.' },
  { code: 'crm.company.create', entity: 'crm.company', action: 'create', description: 'Create companies.' },
  { code: 'crm.company.update', entity: 'crm.company', action: 'update', description: 'Update companies.' },
  { code: 'crm.company.delete', entity: 'crm.company', action: 'delete', description: 'Delete companies.' },
  { code: 'crm.contact.read', entity: 'crm.contact', action: 'read', description: 'Read contacts.' },
  { code: 'crm.contact.create', entity: 'crm.contact', action: 'create', description: 'Create contacts.' },
  { code: 'crm.contact.update', entity: 'crm.contact', action: 'update', description: 'Update contacts.' },
  { code: 'crm.contact.delete', entity: 'crm.contact', action: 'delete', description: 'Delete contacts.' },
  { code: 'crm.lead.read', entity: 'crm.lead', action: 'read', description: 'Read leads.' },
  { code: 'crm.lead.create', entity: 'crm.lead', action: 'create', description: 'Create leads.' },
  { code: 'crm.lead.update', entity: 'crm.lead', action: 'update', description: 'Update leads.' },
  { code: 'crm.lead.delete', entity: 'crm.lead', action: 'delete', description: 'Delete leads.' },
  { code: 'crm.deal.read', entity: 'crm.deal', action: 'read', description: 'Read deals.' },
  { code: 'crm.deal.create', entity: 'crm.deal', action: 'create', description: 'Create deals.' },
  { code: 'crm.deal.update', entity: 'crm.deal', action: 'update', description: 'Update deals.' },
  { code: 'crm.deal.delete', entity: 'crm.deal', action: 'delete', description: 'Delete deals.' },
  { code: 'crm.activity.read', entity: 'crm.activity', action: 'read', description: 'Read activities.' },
  { code: 'crm.activity.create', entity: 'crm.activity', action: 'create', description: 'Create activities.' },
  // Sales
  { code: 'sales.product.read', entity: 'sales.product', action: 'read', description: 'Read products.' },
  { code: 'sales.product.create', entity: 'sales.product', action: 'create', description: 'Create products.' },
  { code: 'sales.product.update', entity: 'sales.product', action: 'update', description: 'Update products.' },
  { code: 'sales.product.delete', entity: 'sales.product', action: 'delete', description: 'Delete products.' },
  { code: 'sales.quote.read', entity: 'sales.quote', action: 'read', description: 'Read quotes.' },
  { code: 'sales.quote.create', entity: 'sales.quote', action: 'create', description: 'Create quotes.' },
  { code: 'sales.quote.update', entity: 'sales.quote', action: 'update', description: 'Update quotes / send quotes.' },
  { code: 'sales.quote.delete', entity: 'sales.quote', action: 'delete', description: 'Delete quotes.' },
  { code: 'sales.target.read', entity: 'sales.target', action: 'read', description: 'Read sales targets.' },
  { code: 'sales.target.update', entity: 'sales.target', action: 'update', description: 'Manage sales targets.' },
  // Projects
  { code: 'project.project.read', entity: 'project.project', action: 'read', description: 'Read projects.' },
  { code: 'project.project.create', entity: 'project.project', action: 'create', description: 'Create projects.' },
  { code: 'project.project.update', entity: 'project.project', action: 'update', description: 'Update projects.' },
  { code: 'project.project.delete', entity: 'project.project', action: 'delete', description: 'Delete projects.' },
  { code: 'project.task.read', entity: 'project.task', action: 'read', description: 'Read tasks.' },
  { code: 'project.task.create', entity: 'project.task', action: 'create', description: 'Create tasks.' },
  { code: 'project.task.update', entity: 'project.task', action: 'update', description: 'Update tasks.' },
  { code: 'project.task.delete', entity: 'project.task', action: 'delete', description: 'Delete tasks.' },
  // Search / notifications
  { code: 'search.read', entity: 'search', action: 'read', description: 'Run global search.' },
  { code: 'notification.read', entity: 'notification', action: 'read', description: 'Read notifications.' },
  { code: 'notification.update', entity: 'notification', action: 'update', description: 'Mark notifications read.' },
  // Inventory
  { code: 'inventory.product.read', entity: 'inventory.product', action: 'read', description: 'Read products/stock.' },
  { code: 'inventory.product.update', entity: 'inventory.product', action: 'update', description: 'Manage products + stock levels.' },
  { code: 'inventory.product.create', entity: 'inventory.product', action: 'create', description: 'Create products.' },
  { code: 'inventory.category.update', entity: 'inventory.category', action: 'update', description: 'Manage categories.' },
  { code: 'inventory.supplier.update', entity: 'inventory.supplier', action: 'update', description: 'Manage suppliers.' },
  { code: 'inventory.warehouse.update', entity: 'inventory.warehouse', action: 'update', description: 'Manage warehouses/locations.' },
  { code: 'inventory.stock.movement', entity: 'inventory.stock', action: 'execute', description: 'Record stock movements (IN/OUT/ADJUST).' },
  // Support
  { code: 'support.ticket.read', entity: 'support.ticket', action: 'read', description: 'Read tickets.' },
  { code: 'support.ticket.create', entity: 'support.ticket', action: 'create', description: 'Create tickets.' },
  { code: 'support.ticket.update', entity: 'support.ticket', action: 'update', description: 'Update/assign/resolve tickets + read internal notes.' },
  { code: 'support.comment.create', entity: 'support.comment', action: 'create', description: 'Add comments to tickets.' },
  // HR
  { code: 'hr.employee.read', entity: 'hr.employee', action: 'read', description: 'Read employees.' },
  { code: 'hr.employee.create', entity: 'hr.employee', action: 'create', description: 'Create employees.' },
  { code: 'hr.employee.update', entity: 'hr.employee', action: 'update', description: 'Update employee status.' },
  { code: 'hr.department.update', entity: 'hr.department', action: 'update', description: 'Manage departments.' },
  // Documents
  { code: 'documents.read', entity: 'documents', action: 'read', description: 'Read/download documents.' },
  { code: 'documents.create', entity: 'documents', action: 'create', description: 'Upload documents.' },
  { code: 'documents.update', entity: 'documents', action: 'update', description: 'Edit documents/folders.' },
  { code: 'documents.delete', entity: 'documents', action: 'delete', description: 'Delete documents.' },
  // Automation
  { code: 'automation.workflow.read', entity: 'automation.workflow', action: 'read', description: 'Read workflows.' },
  { code: 'automation.workflow.create', entity: 'automation.workflow', action: 'create', description: 'Create workflows.' },
  { code: 'automation.workflow.update', entity: 'automation.workflow', action: 'update', description: 'Edit/enable workflows.' },
  { code: 'automation.workflow.delete', entity: 'automation.workflow', action: 'delete', description: 'Delete workflows.' },
  { code: 'automation.execution.read', entity: 'automation.execution', action: 'read', description: 'Read workflow executions.' },
  // Observability
  { code: 'observability.read', entity: 'observability', action: 'read', description: 'Read health/metrics/errors.' },
  // Finance
  { code: 'finance.invoice.read', entity: 'finance.invoice', action: 'read', description: 'Read invoices.' },
  { code: 'finance.invoice.create', entity: 'finance.invoice', action: 'create', description: 'Create invoices.' },
  { code: 'finance.invoice.update', entity: 'finance.invoice', action: 'update', description: 'Update invoices.' },
  { code: 'finance.invoice.delete', entity: 'finance.invoice', action: 'delete', description: 'Delete invoices.' },
  { code: 'finance.payment.create', entity: 'finance.payment', action: 'create', description: 'Record payments.' },
  { code: 'finance.payment.read', entity: 'finance.payment', action: 'read', description: 'Read payments.' },
  { code: 'finance.expense.read', entity: 'finance.expense', action: 'read', description: 'Read expenses.' },
  { code: 'finance.expense.create', entity: 'finance.expense', action: 'create', description: 'Create expenses.' },
  { code: 'finance.expense.update', entity: 'finance.expense', action: 'update', description: 'Update expenses.' },
  { code: 'finance.account.read', entity: 'finance.account', action: 'read', description: 'Read accounts.' },
  { code: 'finance.account.update', entity: 'finance.account', action: 'update', description: 'Manage accounts.' },
  // Phase 6 — AI layer
  { code: 'ai.copilot.ask', entity: 'ai.copilot', action: 'execute', description: 'Ask the AI copilot.' },
  { code: 'ai.copilot.read', entity: 'ai.copilot', action: 'read', description: 'Read copilot conversations.' },
  { code: 'ai.agent.run', entity: 'ai.agent', action: 'execute', description: 'Run AI agents.' },
  { code: 'ai.tool.execute', entity: 'ai.tool', action: 'execute', description: 'Permit AI read/low tool execution within RBAC scope.' },
  { code: 'ai.approval.read', entity: 'ai.approval', action: 'read', description: 'Read pending AI approvals.' },
  { code: 'ai.approval.decide', entity: 'ai.approval', action: 'execute', description: 'Approve / reject / edit AI approval requests.' },
  { code: 'ai.graph.read', entity: 'ai.graph', action: 'read', description: 'Read the business graph.' },
] as const;

/** Convenience flat accessor: `PERMISSIONS.iam.roles.create === 'iam.roles.create'`. */
function buildPermissions(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const spec of PERMISSION_SPECS) out[spec.code] = spec.code;
  return out;
}

export const PERMISSIONS = buildPermissions();

/** All valid permission codes, for the DB seed / role wiring. */
export function allPermissionCodes(): string[] {
  return PERMISSION_SPECS.map((p) => p.code);
}
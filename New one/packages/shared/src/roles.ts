/**
 * NEXUS OS — core role catalogue (authoritative for RBAC).
 *
 * Mirrors org-scoped `Role` rows seeded into the DB (packages/db).
 * The DB is the source of truth at runtime; these literals exist so the API
 * never repeats org-scoped role strings inline (upgrade Decision 3), and so
 * the web layer can type-check its role-aware UI.
 */

export const ROLE_CODES = [
  'OWNER',
  'ADMIN',
  'MANAGER',
  'SALES',
  'FINANCE',
  'OPERATIONS',
  'HR',
  'SUPPORT',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_LABELS: Record<RoleCode, string> = {
  OWNER: 'Owner',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  SALES: 'Sales',
  FINANCE: 'Finance',
  OPERATIONS: 'Operations',
  HR: 'HR',
  SUPPORT: 'Support',
};

export const ROLES: ReadonlyArray<{ code: RoleCode; label: string; description: string }> = [
  { code: 'OWNER', label: ROLE_LABELS.OWNER, description: 'Full control of the organization.' },
  { code: 'ADMIN', label: ROLE_LABELS.ADMIN, description: 'Configure and manage the organization.' },
  { code: 'MANAGER', label: ROLE_LABELS.MANAGER, description: 'Manage teams, projects and approvals.' },
  { code: 'SALES', label: ROLE_LABELS.SALES, description: 'Run the sales pipeline and quotes.' },
  { code: 'FINANCE', label: ROLE_LABELS.FINANCE, description: 'Invoicing, payments and expenses.' },
  { code: 'OPERATIONS', label: ROLE_LABELS.OPERATIONS, description: 'Operations, inventory and delivery.' },
  { code: 'HR', label: ROLE_LABELS.HR, description: 'Manage people, departments and documents.' },
  { code: 'SUPPORT', label: ROLE_LABELS.SUPPORT, description: 'Handle tickets and customer support.' },
];

export function isRoleCode(value: string): value is RoleCode {
  return (ROLE_CODES as readonly string[]).includes(value);
}
"use strict";
/**
 * NEXUS OS — core role catalogue (authoritative for RBAC).
 *
 * Mirrors org-scoped `Role` rows seeded into the DB (packages/db).
 * The DB is the source of truth at runtime; these literals exist so the API
 * never repeats org-scoped role strings inline (upgrade Decision 3), and so
 * the web layer can type-check its role-aware UI.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = exports.ROLE_LABELS = exports.ROLE_CODES = void 0;
exports.isRoleCode = isRoleCode;
exports.ROLE_CODES = [
    'OWNER',
    'ADMIN',
    'MANAGER',
    'SALES',
    'FINANCE',
    'OPERATIONS',
    'HR',
    'SUPPORT',
];
exports.ROLE_LABELS = {
    OWNER: 'Owner',
    ADMIN: 'Administrator',
    MANAGER: 'Manager',
    SALES: 'Sales',
    FINANCE: 'Finance',
    OPERATIONS: 'Operations',
    HR: 'HR',
    SUPPORT: 'Support',
};
exports.ROLES = [
    { code: 'OWNER', label: exports.ROLE_LABELS.OWNER, description: 'Full control of the organization.' },
    { code: 'ADMIN', label: exports.ROLE_LABELS.ADMIN, description: 'Configure and manage the organization.' },
    { code: 'MANAGER', label: exports.ROLE_LABELS.MANAGER, description: 'Manage teams, projects and approvals.' },
    { code: 'SALES', label: exports.ROLE_LABELS.SALES, description: 'Run the sales pipeline and quotes.' },
    { code: 'FINANCE', label: exports.ROLE_LABELS.FINANCE, description: 'Invoicing, payments and expenses.' },
    { code: 'OPERATIONS', label: exports.ROLE_LABELS.OPERATIONS, description: 'Operations, inventory and delivery.' },
    { code: 'HR', label: exports.ROLE_LABELS.HR, description: 'Manage people, departments and documents.' },
    { code: 'SUPPORT', label: exports.ROLE_LABELS.SUPPORT, description: 'Handle tickets and customer support.' },
];
function isRoleCode(value) {
    return exports.ROLE_CODES.includes(value);
}
//# sourceMappingURL=roles.js.map
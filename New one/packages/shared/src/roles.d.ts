/**
 * NEXUS OS — core role catalogue (authoritative for RBAC).
 *
 * Mirrors org-scoped `Role` rows seeded into the DB (packages/db).
 * The DB is the source of truth at runtime; these literals exist so the API
 * never repeats org-scoped role strings inline (upgrade Decision 3), and so
 * the web layer can type-check its role-aware UI.
 */
export declare const ROLE_CODES: readonly ["OWNER", "ADMIN", "MANAGER", "SALES", "FINANCE", "OPERATIONS", "HR", "SUPPORT"];
export type RoleCode = (typeof ROLE_CODES)[number];
export declare const ROLE_LABELS: Record<RoleCode, string>;
export declare const ROLES: ReadonlyArray<{
    code: RoleCode;
    label: string;
    description: string;
}>;
export declare function isRoleCode(value: string): value is RoleCode;
//# sourceMappingURL=roles.d.ts.map
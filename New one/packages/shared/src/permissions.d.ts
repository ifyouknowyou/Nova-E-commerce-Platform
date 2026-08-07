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
export declare const PERMISSION_SPECS: readonly PermissionSpec[];
export declare const PERMISSIONS: Record<string, string>;
/** All valid permission codes, for the DB seed / role wiring. */
export declare function allPermissionCodes(): string[];
//# sourceMappingURL=permissions.d.ts.map
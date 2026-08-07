"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = exports.PERMISSION_SPECS = void 0;
exports.allPermissionCodes = allPermissionCodes;
/** Phase-1 scope. Higher modules add entities in later phases. */
exports.PERMISSION_SPECS = [
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
];
/** Convenience flat accessor: `PERMISSIONS.iam.roles.create === 'iam.roles.create'`. */
function buildPermissions() {
    const out = {};
    for (const spec of exports.PERMISSION_SPECS)
        out[spec.code] = spec.code;
    return out;
}
exports.PERMISSIONS = buildPermissions();
/** All valid permission codes, for the DB seed / role wiring. */
function allPermissionCodes() {
    return exports.PERMISSION_SPECS.map((p) => p.code);
}
//# sourceMappingURL=permissions.js.map
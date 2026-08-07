/** Phase 7 — the three visual experiences, keyed by role. */
export type VisualTier = 'employee' | 'manager' | 'owner';

/**
 * Map a member's role set to the visual tier they see.
 *   OWNER / ADMIN → immersive 3D command center (owner tier)
 *   MANAGER       → analytical, data-dense 2D (manager tier)
 *   everyone else → flat, fast, clean 2D workspace (employee tier)
 */
export function tierOf(roles: string[] | undefined): VisualTier {
  if (!roles) return 'employee';
  if (roles.includes('OWNER') || roles.includes('ADMIN')) return 'owner';
  if (roles.includes('MANAGER')) return 'manager';
  return 'employee';
}

/** Human label for the active tier (used in the shell badge). */
export function tierLabel(tier: VisualTier): string {
  switch (tier) {
    case 'owner':
      return 'Executive';
    case 'manager':
      return 'Manager';
    default:
      return 'Workspace';
  }
}

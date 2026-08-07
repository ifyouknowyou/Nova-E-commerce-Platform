/**
 * NEXUS OS — shared domain contracts, consumed by both the API and the web app.
 * Framework-free: plain TypeScript `as const` literals, no runtime deps.
 */

export * from './roles';
export * from './permissions';
export * from './errors';
export * from './session';
export * from './password';
export * from './domain-enums';

/** NEXUS OS tenant claim carried in the signed session. */
export interface SessionClaim {
  userId: string;
  orgId: string;
  roles: string[];
}

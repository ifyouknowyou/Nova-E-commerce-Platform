/**
 * NEXUS OS — Phase 2 domain enums, mirroring the Prisma schema.
 */

export const VERIFICATION_TOKEN_TYPES = [
  'EMAIL_VERIFICATION',
  'PASSWORD_RESET',
  'INVITE_ACCEPT',
] as const;
export type VerificationTokenType = (typeof VERIFICATION_TOKEN_TYPES)[number];

export const SECURITY_EVENT_TYPES = [
  'SIGNUP',
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET',
  'EMAIL_VERIFIED',
  'SESSION_REVOKED',
  'INVITE_SENT',
  'INVITE_ACCEPTED',
  'ORG_SWITCHED',
  'INTEGRATION_TESTED',
] as const;
export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[number];

export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INTEGRATION_PROVIDERS = ['WEBHOOK'] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_STATUSES = ['DISCONNECTED', 'CONNECTED', 'ERROR'] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'EXECUTE'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const NOTIFICATION_TYPES = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Public profile of the authenticated principal + tenant context. */
export interface SessionUser {
  userId: string;
  orgId: string;
  roles: string[];
  email: string;
  emailVerified: boolean;
}

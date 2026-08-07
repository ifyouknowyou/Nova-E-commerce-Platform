/**
 * NEXUS OS — password policy (shared default + validator).
 * The org's effective policy lives in Settings (security.password.*); this is
 * the platform default the org policy extends/overrides.
 */

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSymbol: boolean;
}

export const PASSWORD_POLICY: PasswordPolicy = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSymbol: false,
};

/** Return the list of violated policy descriptions (empty when valid). */
export function validatePassword(password: string, policy: PasswordPolicy = PASSWORD_POLICY): string[] {
  const errors: string[] = [];
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters.`);
  }
  if (password.length > 72) {
    errors.push('Password must be 72 characters or fewer.');
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter.');
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter.');
  }
  if (policy.requireDigit && !/[0-9]/.test(password)) {
    errors.push('Password must contain a digit.');
  }
  if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain a symbol.');
  }
  return errors;
}

/** Settings keys the org can use to override the platform default. */
export const PASSWORD_POLICY_SETTING_KEYS = [
  'security.password.minLength',
  'security.password.requireUppercase',
  'security.password.requireLowercase',
  'security.password.requireDigit',
  'security.password.requireSymbol',
] as const;

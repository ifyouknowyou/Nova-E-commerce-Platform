import { describe, expect, it } from 'vitest';
import { tierOf, tierLabel } from './role-tier';

describe('tierOf — the three visual experiences', () => {
  it('maps OWNER and ADMIN to the owner tier', () => {
    expect(tierOf(['OWNER'])).toBe('owner');
    expect(tierOf(['ADMIN', 'MANAGER'])).toBe('owner');
    expect(tierOf(['SALES', 'ADMIN'])).toBe('owner');
  });

  it('maps MANAGER to the manager tier', () => {
    expect(tierOf(['MANAGER'])).toBe('manager');
    expect(tierOf(['MANAGER', 'HR'])).toBe('manager');
  });

  it('maps operational roles to the employee tier', () => {
    for (const roles of [['SALES'], ['FINANCE'], ['OPERATIONS'], ['HR'], ['SUPPORT'], []]) {
      expect(tierOf(roles)).toBe('employee');
    }
  });

  it('defaults to employee for an unknown/undefined role set', () => {
    expect(tierOf(undefined)).toBe('employee');
  });

  it('labels tiers for the shell badge', () => {
    expect(tierLabel('owner')).toBe('Executive');
    expect(tierLabel('manager')).toBe('Manager');
    expect(tierLabel('employee')).toBe('Workspace');
  });
});

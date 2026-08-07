/**
 * Workflow condition evaluation (pure + unit-testable).
 *
 * Conditions are a list of `{ field, op, value }` rules ANDed together. `field`
 * is a dot path into the trigger context (e.g. `deal.value`); an absent field
 * fails the condition (fail-closed). Ops: eq, ne, gt, gte, lt, lte, contains.
 */

export type ConditionOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';

export interface Condition {
  field: string;
  op: string;
  value: unknown;
}

export function getPath(context: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[part];
  }, context);
}

export function evaluateCondition(cond: Condition, context: Record<string, unknown>): boolean {
  const actual = getPath(context, cond.field);
  if (actual === undefined) return false; // non-closed
  const expected = cond.value;
  switch (cond.op) {
    case 'eq': return Number(actual) === Number(expected) || String(actual) === String(expected);
    case 'ne': return String(actual) !== String(expected);
    case 'gt': return Number(actual) > Number(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lt': return Number(actual) < Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    case 'contains': return String(actual).toLowerCase().includes(String(expected).toLowerCase());
    default: return false;
  }
}

/** All conditions must hold (AND). Returns true for an empty list. */
export function evaluateConditions(conditions: Condition[] | null | undefined, context: Record<string, unknown>): boolean {
  if (!conditions?.length) return true;
  return conditions.every((c) => evaluateCondition(c, context));
}
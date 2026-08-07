import { evaluateConditions, evaluateCondition, getPath } from './conditions';

describe('Workflow conditions — pure evaluation', () => {
  it('reads nested context via dot paths', () => {
    expect(getPath({ deal: { value: 500 } }, 'deal.value')).toBe(500);
    expect(getPath({ deal: { value: 500 } }, 'deal.missing')).toBeUndefined();
  });

  it('applies numeric + equality ops', () => {
    const ctx = { dealValue: 500, dealName: 'Big' };
    expect(evaluateCondition({ field: 'dealValue', op: 'gte', value: 100 }, ctx)).toBe(true);
    expect(evaluateCondition({ field: 'dealValue', op: 'lt', value: 100 }, ctx)).toBe(false);
    expect(evaluateCondition({ field: 'dealName', op: 'contains', value: 'ig' }, ctx)).toBe(true);
  });

  it('ANDs conditions and fails closed on a missing field', () => {
    expect(evaluateConditions([
      { field: 'dealValue', op: 'gte', value: 100 },
      { field: 'dealName', op: 'ne', value: 'Nope' },
    ], { dealValue: 500, dealName: 'Big' })).toBe(true);

    expect(evaluateConditions([{ field: 'missing', op: 'eq', value: 1 }], {})).toBe(false);
    expect(evaluateConditions([], { anything: true })).toBe(true);
  });
});
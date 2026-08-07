import { filterByPermissions, SearchCategoryDef } from './search.service';

const CATS: SearchCategoryDef[] = [
  { key: 'deals', permission: 'crm.deal.read', fields: ['name'] },
  { key: 'invoices', permission: 'finance.invoice.read', fields: ['number'] },
  { key: 'tickets', permission: 'support.ticket.read', fields: ['subject'] },
];

describe('SearchService — RBAC-aware category filter', () => {
  it('keeps only categories whose permission the caller holds', () => {
    const allowed = filterByPermissions(['crm.deal.read', 'support.ticket.read'], CATS);
    expect(allowed.map((c) => c.key)).toEqual(['deals', 'tickets']);
  });

  it('returns nothing when the caller has no matching permission', () => {
    expect(filterByPermissions(['finance.expense.read'], CATS)).toEqual([]);
  });
});
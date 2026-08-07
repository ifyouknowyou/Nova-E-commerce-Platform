import { computeInvoiceTotals, deriveInvoiceStatus } from './finance.service';

describe('FinanceService — server-computed money', () => {
  it('computes invoice totals from line items', () => {
    const { subtotal, tax, total } = computeInvoiceTotals(
      [{ description: 'a', qty: 10, unitPrice: 100 }, { description: 'b', qty: 2, unitPrice: 250 }],
      0.1,
    );
    expect(subtotal).toBe(1500);
    expect(tax).toBe(150);
    expect(total).toBe(1650);
  });

  it('derives invoice status from the paid balance', () => {
    expect(deriveInvoiceStatus('SENT', 1000, 0)).toBe('SENT');
    expect(deriveInvoiceStatus('SENT', 1000, 500)).toBe('PARTIALLY_PAID');
    expect(deriveInvoiceStatus('SENT', 1000, 1000)).toBe('PAID');
  });
});
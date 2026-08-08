import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable, Kpi, money, fmtDate } from './table';

const columns = [
  { key: 'name', label: 'Name', render: (r: Record<string, unknown>) => String(r.name) },
  { key: 'qty', label: 'Qty', render: (r: Record<string, unknown>) => Number(r.qty) },
];

describe('DataTable', () => {
  it('renders columns with scope + rows', () => {
    render(<DataTable columns={columns} rows={[{ id: '1', name: 'Alpha', qty: 2 }]} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
    expect(headers[0]?.getAttribute('scope')).toBe('col');
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows the empty message when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} empty="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders a screen-reader caption when provided', () => {
    render(<DataTable columns={columns} rows={[{ id: '1', name: 'A' }]} caption="Deals table" />);
    expect(screen.getByText('Deals table')).toBeInTheDocument();
  });
});

describe('Kpi + formatters', () => {
  it('renders a KPI label + value', () => {
    render(<Kpi label="Revenue" value="$1,000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('money formats numbers as USD', () => {
    expect(money(1234.5)).toBe('$1,234.50');
  });

  it('fmtDate handles null', () => {
    expect(fmtDate(null)).toBe('—');
  });
});

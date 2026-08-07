'use client';

import { ReactNode } from 'react';
import styles from './data.module.css';

// Rows are loose API records; render casts fields as needed.
export interface Column {
  key: string;
  label: string;
  render: (row: Record<string, any>) => ReactNode;
}

export function DataTable({ columns, rows, empty }: {
  columns: Column[];
  rows: Record<string, unknown>[];
  empty?: string;
}) {
  if (!rows.length) {
    return <p className={styles.empty}>{empty ?? 'No rows yet.'}</p>;
  }
  return (
    <table className={styles.table}>
      <thead>
        <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={String(row.id ?? i)}>
            {columns.map((c) => <td key={c.key}>{c.render(row)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Kpi({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  );
}

export function money(n: number | string | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function fmtDate(d: string | Date | undefined | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
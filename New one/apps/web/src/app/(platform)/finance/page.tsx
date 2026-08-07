'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable, money, fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Invoice { id: string; number: string; status: string; total: string; paidAmount: string; }
interface Expense { id: string; date: string; amount: string; category: string | null; description: string | null; }

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recordId, setRecordId] = useState('');
  const [payAmt, setPayAmt] = useState('');

  useEffect(() => {
    apiFetch<Invoice[]>('/finance/invoices').then(setInvoices).catch(() => undefined);
    apiFetch<Expense[]>('/finance/expenses').then(setExpenses).catch(() => undefined);
  }, []);

  async function recordPayment() {
    if (!recordId || !payAmt) return;
    await apiFetch(`/finance/invoices/${recordId}/payments`, { method: 'POST', body: JSON.stringify({ amount: Number(payAmt) }) });
    setPayAmt('');
    setInvoices(await apiFetch<Invoice[]>('/finance/invoices'));
  }

  const outstanding = invoices.filter((i) => Number(i.total) > Number(i.paidAmount));

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Finance</h1>
      <p className={shell.lede}>Invoices and payments — totals and status are server-computed.</p>

      <div className={styles.form}>
        <select className={styles.select} value={recordId} onChange={(e) => setRecordId(e.target.value)}>
          <option value="">Select invoice…</option>
          {outstanding.map((i) => (
            <option key={i.id} value={i.id}>{i.number} ({money(i.total)})</option>
          ))}
        </select>
        <input className={styles.input} placeholder="Payment amount" type="number" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
        <button className={styles.btn} onClick={recordPayment} disabled={!recordId || !payAmt}>Record payment</button>
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Invoices</h2>
        <DataTable
          columns={[
            { key: 'number', label: 'Number', render: (r) => r.number },
            { key: 'status', label: 'Status', render: (r) => <span className={styles.badge}>{r.status}</span> },
            { key: 'total', label: 'Total', render: (r) => money(r.total) },
            { key: 'paid', label: 'Paid', render: (r) => money(r.paidAmount) },
          ]}
          rows={invoices as unknown as Record<string, unknown>[]}
        />
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Expenses</h2>
        <DataTable
          columns={[
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
            { key: 'category', label: 'Category', render: (r) => r.category ?? '—' },
            { key: 'amount', label: 'Amount', render: (r) => money(r.amount) },
            { key: 'desc', label: 'Description', render: (r) => r.description ?? '—' },
          ]}
          rows={expenses as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Kpi, money, fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Kpis {
  revenue: number;
  expenses: number;
  profit: number;
  companies: number;
  contacts: number;
  openLeads: number;
  openDeals: number;
  pipelineValue: number;
  wonValue: number;
  outstanding: number;
  activeProjects: number;
  openTasks: number;
  forecast: { actual: number; projected: number; estimated: number };
  recentPayments: { date: string; amount: number }[];
}

interface Bi {
  revenueByMonth: Record<string, number>;
  expensesByCategory: Record<string, number>;
  dealsByStage: { stage: string; count: number; value: number }[];
  leadsByStatus: { status: string; count: number }[];
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [bi, setBi] = useState<Bi | null>(null);

  useEffect(() => {
    apiFetch<Kpis>('/dashboard/kpis').then(setKpis).catch(() => undefined);
    apiFetch<Bi>('/dashboard/bi').then(setBi).catch(() => undefined);
  }, []);

  const months = bi ? Object.entries(bi.revenueByMonth).slice(-6) : [];
  const maxMonth = months.reduce((m, [, v]) => Math.max(m, v), 1);
  const maxDeal = bi ? Math.max(...bi.dealsByStage.map((d) => d.value), 1) : 1;

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Executive Dashboard</h1>
      <p className={shell.lede}>Live from your data — what happened, what needs attention, what to do next.</p>

      <div className={styles.grid}>
        <Kpi label="Revenue (collected)" value={kpis ? money(kpis.revenue) : '…'} />
        <Kpi label="Expenses" value={kpis ? money(kpis.expenses) : '…'} />
        <Kpi label="Profit" value={kpis ? money(kpis.profit) : '…'} />
        <Kpi label="Pipeline value" value={kpis ? money(kpis.pipelineValue) : '…'} />
        <Kpi label="Outstanding invoices" value={kpis ? money(kpis.outstanding) : '…'} />
        <Kpi label="Open deals" value={kpis?.openDeals ?? '…'} />
        <Kpi label="Open leads" value={kpis?.openLeads ?? '…'} />
        <Kpi label="Open tasks" value={kpis?.openTasks ?? '…'} />
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Revenue forecast</h2>
        <div className={styles.grid}>
          <Kpi label="Actual (won)" value={kpis ? money(kpis.forecast.actual) : '…'} />
          <Kpi label="Projected (open × prob)" value={kpis ? money(kpis.forecast.projected) : '…'} />
          <Kpi label="Estimated (full pipeline)" value={kpis ? money(kpis.forecast.estimated) : '…'} />
        </div>
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Revenue by month (last 6)</h2>
        {months.map(([m, v]) => (
          <div key={m} style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>{m}</span><span>{money(v)}</span>
            </div>
            <div className={styles.bar}><div className={styles.barFill} style={{ width: `${(v / maxMonth) * 100}%` }} /></div>
          </div>
        ))}
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Deals by stage</h2>
        {bi?.dealsByStage.map((d) => (
          <div key={d.stage} style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>{d.stage} ({d.count})</span><span>{money(d.value)}</span>
            </div>
            <div className={styles.bar}><div className={styles.barFill} style={{ width: `${(d.value / maxDeal) * 100}%` }} /></div>
          </div>
        ))}
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Recent payments</h2>
        <table className={styles.table}>
          <tbody>
            {kpis?.recentPayments.map((p, i) => (
              <tr key={i}><td>{fmtDate(p.date)}</td><td>{money(p.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
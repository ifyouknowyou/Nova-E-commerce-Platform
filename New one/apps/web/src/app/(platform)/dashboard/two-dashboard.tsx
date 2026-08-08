'use client';

import { Kpi, money, fmtDate } from '@/components/data/table';
import { DonutChart, LineChart, VBarChart } from '@/components/spatial/svg-charts';
import { VisualTier } from '@/lib/role-tier';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';
import { DashboardData, revenueSeries } from './use-dashboard';

export const STAGE_COLORS = ['#e0531f', '#e8a03a', '#00b386', '#1a73e8', '#7c5cff', '#10b981', '#c0392b'];

function Dot({ color }: { color: string }) {
  return <span className={styles.swatch} style={{ background: color }} />; // fallback inline; see svg swatch
}

/**
 * Shared 2D dashboard. `tier: 'employee'` renders flat + lean (operational
 * roles); `tier: 'manager'` renders the same data data-dense with SVG spatial
 * charts. Both answer from real /dashboard data — never canned.
 */
export default function TwoDTier({ data, tier }: { data: DashboardData; tier: VisualTier }) {
  const { kpis, bi } = data;
  const dense = tier === 'manager';
  const months = revenueSeries(bi, dense ? 8 : 6);
  const maxMonth = months.reduce((m, d) => Math.max(m, d.value), 1);
  const deals = (bi?.dealsByStage ?? []).map((d) => ({ label: d.stage, value: d.value }));
  const maxDeal = deals.reduce((m, d) => Math.max(m, d.value), 1);
  const kpiGrid = dense ? `${styles.grid} ${styles.dense}` : styles.grid;

  return (
    <div className={dense ? shell.pageDense : shell.page}>
      <h1 className={shell.h1}>Dashboard</h1>
      <p className={shell.lede}>
        {tier === 'manager' ? 'Analytical view — live from your data.' : 'Your workspace — what needs attention today.'}
      </p>

      <div className={kpiGrid}>
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

      {dense ? (
        <div className={styles.grid}>
          <div className={shell.card}>
            <h2 className={shell.cardTitle}>Revenue trend</h2>
            <LineChart data={months} />
          </div>
          <div className={shell.card}>
            <h2 className={shell.cardTitle}>Deals by stage</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <DonutChart data={deals} colors={STAGE_COLORS} />
              <div style={{ flex: 1, minWidth: 180 }}>
                {deals.map((d, i) => (
                  <div key={d.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span><Dot color={STAGE_COLORS[i % STAGE_COLORS.length] ?? '#888'} />{d.label}</span>
                      <span>{money(d.value)}</span>
                    </div>
                    <div className={styles.bar}><div className={styles.barFill} style={{ width: `${(d.value / maxDeal) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={shell.card} style={{ gridColumn: 'span 2' }}>
            <h2 className={shell.cardTitle}>Revenue by month</h2>
            <VBarChart data={months} />
          </div>
        </div>
      ) : (
        <div className={shell.card}>
          <h2 className={shell.cardTitle}>Revenue by month</h2>
          {months.map((d) => (
            <div key={d.label} style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>{d.label}</span><span>{money(d.value)}</span>
              </div>
              <div className={styles.bar}><div className={styles.barFill} style={{ width: `${(d.value / maxMonth) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Recent payments</h2>
        <table className={styles.table}>
          <caption className="nexus-sr-only">Recent payments</caption>
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
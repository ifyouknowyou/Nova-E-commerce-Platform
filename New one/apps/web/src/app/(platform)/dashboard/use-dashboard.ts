'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';

export interface Kpis {
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

export interface Bi {
  revenueByMonth: Record<string, number>;
  expensesByCategory: Record<string, number>;
  dealsByStage: { stage: string; count: number; value: number }[];
  leadsByStatus: { status: string; count: number }[];
}

export interface DashboardData {
  kpis: Kpis | null;
  bi: Bi | null;
}

export function useDashboardData(): DashboardData {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [bi, setBi] = useState<Bi | null>(null);

  useEffect(() => {
    apiFetch<Kpis>('/dashboard/kpis').then(setKpis).catch(() => undefined);
    apiFetch<Bi>('/dashboard/bi').then(setBi).catch(() => undefined);
  }, []);

  return { kpis, bi };
}

/** Flatten revenue-by-month into an ordered series for charts. */
export function revenueSeries(bi: Bi | null, last = 6): { label: string; value: number }[] {
  return bi ? Object.entries(bi.revenueByMonth).slice(-last).map(([label, value]) => ({ label, value })) : [];
}
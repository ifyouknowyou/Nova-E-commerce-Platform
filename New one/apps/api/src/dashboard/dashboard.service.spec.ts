import { forecastPipeline, groupByMonth } from './dashboard.service';

describe('DashboardService — pure financial math', () => {
  it('forecast clearly separates actual / projected / estimated', () => {
    // open: 100k @ 50% + 200k @ 25% = weighted 100k; won: 40k.
    const f = forecastPipeline(300000, 100000, 40000);
    expect(f.actual).toBe(40000);
    expect(f.projected).toBe(100000);
    expect(f.estimated).toBe(340000); // open gross + won
  });

  it('groupByMonth buckets dated rows', () => {
    const rows = [
      { date: new Date('2026-05-05'), amount: '100.50' },
      { date: new Date('2026-05-20'), amount: '50' },
      { date: new Date('2026-06-01'), amount: '25' },
    ];
    expect(groupByMonth(rows)).toEqual({ '2026-05': 150.5, '2026-06': 25 });
  });
});
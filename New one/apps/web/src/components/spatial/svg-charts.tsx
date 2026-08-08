'use client';

import styles from './spatial.module.css';

const AXIS_LABEL = '#a3a394';

/** Vertical bar chart (spatial, data-dense). Pure SVG, token colors. */
export function VBarChart({ data, height = 140 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <svg viewBox={`0 0 100 ${height}`} className={styles.chart} role="img" aria-label="Bar chart" style={{ height }}>
      {data.map((d, i) => {
        const w = 100 / data.length;
        const h = (d.value / max) * (height - 18);
        const x = i * w + w * 0.15;
        return (
          <g key={i}>
            <title>{`${d.label}: ${d.value}`}</title>
            <rect className={styles.barV} x={x} y={height - h - 4} width={w * 0.7} height={h} />
            <text x={i * w + w / 2} y={height - 2} textAnchor="middle" fontSize={8} fill={AXIS_LABEL}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Line chart (revenue trend). */
export function LineChart({ data, width = 100, height = 60 }: { data: { label: string; value: number }[]; width?: number; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const pad = 4;
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({
    x: pad + i * stepX,
    y: height - pad - (d.value / max) * (height - pad * 2),
    ...d,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1]?.x ?? pad},${height} L${pad},${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} role="img" aria-label="Revenue trend">
      {pts.map((p, i) => (
        <line key={i} className={styles.gridLine} x1={p.x} y1={0} x2={p.x} y2={height} />
      ))}
      <path className={styles.lineArea} d={area} />
      <path className={styles.line} d={line} />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2} fill="currentColor" />
          <text x={p.x} y={height - 1} textAnchor="middle" fontSize={7} fill={AXIS_LABEL}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

/** Donut chart (deals by stage). */
export function DonutChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const C = 2 * Math.PI * 15.915;
  let acc = 0;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const dash = `${frac * C} ${C}`;
    const offset = C / 4 - acc * C;
    acc += frac;
    return (
      <circle key={d.label} cx={20} cy={20} r={15.915} fill="none" stroke={colors[i % colors.length]} strokeWidth={5} strokeDasharray={dash} strokeDashoffset={offset} />
    );
  });
  return (
    <div role="img" aria-label="Distribution">
      <svg viewBox="0 0 40 40" className={styles.chart} style={{ maxWidth: 140 }}>
        {arcs}
        <circle className={styles.donutHole} cx={20} cy={20} r={9} />
      </svg>
    </div>
  );
}
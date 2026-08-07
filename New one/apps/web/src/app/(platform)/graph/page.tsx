'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Node { id: string; type: string; label: string; meta?: Record<string, unknown>; }
interface Edge { source: string; target: string; type: string; }
interface Graph { nodes: Node[]; edges: Edge[]; }

const COLORS: Record<string, string> = {
  company: '#7c5cff', contact: '#3d8bff', deal: '#00b386', invoice: '#f59e0b',
  payment: '#10b981', product: '#ef4444', ticket: '#8b5cf6', project: '#0ea5e9',
};
const FG_LIGHT = '#17170f';
const FG_DARK = '#f2f2ea';
const STROKE_LIGHT = '#0f1117';
const STROKE_DARK = '#1a1a14';
const EDGE_LIGHT = '#c9c9bd';
const EDGE_DARK = '#3a4157';

export default function GraphPage() {
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selected, setSelected] = useState<Node | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    apiFetch<Graph>('/ai/graph').then(setGraph).catch((e) => setMsg(e instanceof Error ? e.message : 'Failed'));
  }, []);

  const { node: positioned, dims } = useMemo(() => layout(graph), [graph]);

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Business Graph</h1>
      <p className={shell.lede}>Real relationships between your entities — the single tenant-scoped AI context. Click a node for details.</p>
      {msg && <p className={styles.error}>{msg}</p>}

      <div className={shell.card}>
        <svg viewBox={`0 0 ${dims.w} ${dims.h}`} style={{ width: '100%', height: 480, background: dark ? '#0f1117' : '#ffffff', border: '1px solid var(--nexus-border)', borderRadius: 'var(--radius-sm)' }}>
          {graph.edges.map((e, i) => {
            const s = positioned.get(String(e.source));
            const t = positioned.get(String(e.target));
            if (!s || !t) return null;
            return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={dark ? EDGE_DARK : EDGE_LIGHT} strokeWidth={1} />;
          })}
          {graph.nodes.map((n) => {
            const p = positioned.get(String(n.id));
            if (!p) return null;
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-label={`${n.type}: ${n.label}`}
                onClick={() => setSelected(n)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(n); } }}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <circle cx={p.x} cy={p.y} r={10} fill={COLORS[n.type] ?? (dark ? '#64748b' : '#94a3b8')} stroke={dark ? STROKE_DARK : STROKE_LIGHT} strokeWidth={2} />
                <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize={11} fill={dark ? FG_DARK : FG_LIGHT}>{n.label.slice(0, 16)}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          {Object.entries(COLORS).map(([type, color]) => {
            const count = graph.nodes.filter((n) => n.type === type).length;
            return count > 0 ? (
              <span key={type} className={styles.badge} style={{ borderColor: color }}>{type} · {count}</span>
            ) : null;
          })}
        </div>
      </div>

      {selected && (
        <div className={shell.card} style={{ marginTop: 12 }}>
          <h2 className={shell.cardTitle}>{selected.label}</h2>
          <div className={styles.row}><span>Type</span><strong>{selected.type}</strong></div>
          <div className={styles.row}><span>Id</span><strong className={shell.mono}>{selected.id}</strong></div>
          {selected.meta && Object.entries(selected.meta).map(([k, v]) => (
            <div className={styles.row} key={k}><span>{k}</span><strong>{String(v)}</strong></div>
          ))}
        </div>
      )}

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Edges ({graph.edges.length})</h2>
        <DataTable
          columns={[
            { key: 's', label: 'Source', render: (r) => labelOf(graph, String(r.source)) },
            { key: 'type', label: 'Relation', render: (r) => <span className={styles.badge}>{r.type}</span> },
            { key: 't', label: 'Target', render: (r) => labelOf(graph, String(r.target)) },
          ]}
          rows={graph.edges as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}

/** Simple concentric-by-type layout (deterministic; no external lib). */
function layout(graph: Graph): { node: Map<string, { x: number; y: number }>; dims: { w: number; h: number } } {
  const W = 900, H = 460, cx = W / 2, cy = H / 2;
  const m = new Map<string, { x: number; y: number }>();
  const grouped = new Map<string, Node[]>();
  for (const n of graph.nodes) {
    const arr = grouped.get(n.type) ?? [];
    arr.push(n); grouped.set(n.type, arr);
  }
  const types = [...grouped.entries()];
  const ring = types.length <= 1 ? 0 : 150;
  const slot = types.length === 0 ? 1 : (2 * Math.PI) / types.length;
  types.forEach(([_type, nodes], ti) => {
    const angle = -Math.PI / 2 + ti * slot;
    const base = { x: cx + ring * Math.cos(angle), y: cy + ring * Math.sin(angle) };
    nodes.forEach((n, i) => {
      const offset = nodes.length <= 1 ? { x: 0, y: 0 } : {
        x: 70 * Math.cos(2 * Math.PI * (i / nodes.length)),
        y: 70 * Math.sin(2 * Math.PI * (i / nodes.length)),
      };
      m.set(String(n.id), { x: base.x + offset.x, y: base.y + offset.y });
    });
  });
  return { node: m, dims: { w: W, h: H } };
}

function labelOf(graph: Graph, id: string): string {
  const n = graph.nodes.find((x) => x.id === id);
  return n ? n.label : id;
}
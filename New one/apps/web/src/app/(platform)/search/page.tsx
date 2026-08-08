'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

type Row = { id: string; [k: string]: unknown };
interface SearchResult { query: string; results: Record<string, Row[]>; }

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<SearchResult | null>(null);
  const [busy, setBusy] = useState(false);

  // Debounced live search.
  useEffect(() => {
    if (!q.trim()) { setData(null); return; }
    setBusy(true);
    const t = setTimeout(() => {
      apiFetch<SearchResult>(`/search?q=${encodeURIComponent(q)}`).then(setData).catch(() => undefined).finally(() => setBusy(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const label = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Global search</h1>
      <p className={shell.lede}>RBAC-aware, tenant-scoped results across your modules.</p>
      <input className={styles.input} style={{ width: '100%', fontSize: '1.1rem' }}
        aria-label="Search" onChange={(e) => setQ(e.target.value)} value={q} autoFocus />

      <div style={{ marginTop: '1rem' }}>
        {busy && <p className={styles.empty}>Searching…</p>}
        {data && !busy && (
          <>
            {Object.entries(data.results).map(([cat, rows]) => (
              <div key={cat} className={shell.card}>
                <h2 className={shell.cardTitle}>{label(cat)} ({rows.length})</h2>
                {rows.length === 0 ? (
                  <p className={styles.empty}>No {label(cat).toLowerCase()}.</p>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {rows.map((r) => (
                      <li key={String(r.id)} className={shell.row}>
                        <span>{String(r.name ?? r.title ?? r.subject ?? r.number ?? r.id)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {!Object.keys(data.results).length && <p className={styles.empty}>No results for “{data.query}”.</p>}
          </>
        )}
      </div>
    </div>
  );
}
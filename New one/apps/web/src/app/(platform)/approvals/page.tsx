'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Approval {
  id: string; source: string; status: string; targetKey: string;
  summary: { description?: string; why?: string; dataAffected?: string; expectedResult?: string; risk?: string };
  input?: Record<string, unknown> | null;
  editInput?: Record<string, unknown> | null;
  result?: { summary?: string } | null;
  requestedById?: string | null; decidedById?: string | null;
  createdAt: string; decidedAt?: string | null;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function reload() {
    apiFetch<Approval[]>('/ai/approvals').then(setApprovals).catch((e) => setMsg(e instanceof Error ? e.message : 'Failed'));
  }
  useEffect(() => { reload(); }, []);

  async function decide(id: string, action: 'approve' | 'deny' | 'edit') {
    if (busy) return;
    setBusy(id); setMsg(null);
    try {
      const body: Record<string, unknown> = { action };
      if (action === 'edit') {
        try { body.editInput = JSON.parse(editVal || '{}'); }
        catch { setMsg('Edit input must be valid JSON'); setBusy(null); return; }
      }
      const res = await apiFetch<{ executedResult?: { summary?: string } }>(`/ai/approvals/${id}/decide`, {
        method: 'POST', body: JSON.stringify(body),
      });
      setMsg(action === 'deny' ? 'Rejected and logged.' : res.executedResult?.summary ? `Executed: ${res.executedResult.summary}` : (action === 'edit' ? 'Edit staged — approve to execute.' : 'Approved.'));
      reload();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(null); setEditing(null); }
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>AI Approvals</h1>
      <p className={shell.lede}>Human-in-the-loop: irreversible AI actions never execute without your approval. Orphaned requests auto-deny.</p>

      {msg && <p className={styles.error}>{msg}</p>}

      {approvals.length === 0 ? (
        <div className={shell.card}><p className={styles.empty}>No approval requests yet.</p></div>
      ) : approvals.map((a) => (
        <div className={shell.card} key={a.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={shell.cardTitle}>
              <span className={a.status === 'PENDING' ? styles.badgeOpen : a.status === 'DENIED' || a.status === 'EXPIRED' ? styles.badge : styles.badgeDone}>
                {a.status}
              </span>
              {' '}{a.targetKey}
            </h2>
            <span className={styles.badge}>{a.summary.risk ?? ''}</span>
          </div>

          <div className={styles.row}><span>WHAT</span><strong>{a.summary.description ?? a.targetKey}</strong></div>
          <div className={styles.row}><span>WHY</span><strong>{a.summary.why ?? '—'}</strong></div>
          <div className={styles.row}><span>DATA AFFECTED</span><strong className={shell.mono}>{a.summary.dataAffected ?? '—'}</strong></div>
          <div className={styles.row}><span>EXPECTED RESULT</span><strong>{a.summary.expectedResult ?? '—'}</strong></div>
          <div className={styles.row}><span>Requested</span><strong>{fmtDate(a.createdAt)}</strong></div>
          {a.result?.summary && <div className={styles.row}><span>RESULT</span><strong>{a.result.summary}</strong></div>}

          {a.status === 'PENDING' && (
            <div className={styles.form} style={{ marginTop: 10 }}>
              <button className={styles.btn} disabled={busy === a.id} onClick={() => decide(a.id, 'approve')}>APPROVE</button>
              <button className={styles.btn} disabled={busy === a.id} onClick={() => decide(a.id, 'deny')}>REJECT</button>
              <button className={styles.btn} disabled={busy === a.id} onClick={() => setEditing(editing === a.id ? null : a.id)}>EDIT</button>
            </div>
          )}

          {editing === a.id && a.status === 'PENDING' && (
            <div className={styles.form} style={{ marginTop: 8 }}>
              <input
                className={styles.input} style={{ flex: 1 }} placeholder='{"invoiceId":"…","amount":250}'
                value={editVal} onChange={(e) => setEditVal(e.target.value)}
              />
              <button className={styles.btn} onClick={() => decide(a.id, 'edit')}>Stage edit</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
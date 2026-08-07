'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Msg {
  id: string; role: string; content: string; createdAt: string;
  evidence?: unknown; records?: unknown[] | null;
}
interface Conv { id: string; title: string; updatedAt: string; }
interface AskResp {
  conversationId: string; messageId: string; answer: string;
  needsApproval?: string; evidence?: unknown; records?: unknown[];
}

export default function CopilotPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [msgs, setMsgs] = useState<Record<string, Msg[]>>({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<Conv[]>('/ai/copilot/conversations')
      .then(setConvs)
      .catch((e) => setMsg(e instanceof Error ? e.message : 'Failed'));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, activeId]);

  async function openConv(id: string) {
    setActiveId(id);
    if (msgs[id]) return;
    try {
      const conv = await apiFetch<{ messages: Msg[] }>(`/ai/copilot/conversations/${id}`);
      setMsgs((m) => ({ ...m, [id]: conv.messages }));
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Failed'); }
  }

  async function ask() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true); setMsg(null);
    const optimistic: Msg = { id: 'local', role: 'USER', content: text, createdAt: new Date().toISOString() };
    const list = activeId ? [...(msgs[activeId] ?? []), optimistic] : [optimistic];
    if (activeId) setMsgs((m) => ({ ...m, [activeId]: list }));
    try {
      const res = await apiFetch<AskResp>('/ai/copilot', {
        method: 'POST',
        body: JSON.stringify({ message: text, ...(activeId ? { conversationId: activeId } : {}) }),
      });
      const reply: Msg = {
        id: res.messageId, role: 'AGENT', content: res.answer, createdAt: new Date().toISOString(),
        evidence: res.evidence, records: res.records,
      };
      const existing = msgs[res.conversationId] ?? [];
      setMsgs((m) => ({ ...m, [res.conversationId]: [...existing, optimistic, reply] }));
      setActiveId(res.conversationId);
      setConvs((c) => [{ id: res.conversationId, title: text.slice(0, 60), updatedAt: new Date().toISOString() }, ...c.filter((x) => x.id !== res.conversationId)]);
      if (res.needsApproval) setMsg(`⚠️ ${res.answer} Open Approvals to act.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
      if (activeId) setMsgs((m) => ({ ...m, [activeId]: [...(m[activeId] ?? [])] }));
    } finally { setBusy(false); setInput(''); }
  }

  const current: Msg[] = activeId ? (msgs[activeId] ?? []) : (msgs[Object.keys(msgs)[0] ?? ''] ?? []);

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>AI Copilot</h1>
      <p className={shell.lede}>Ask across your tenant&apos;s real data — pipeline, sales, invoices, inventory, projects, support.</p>

      <div className={styles.form} style={{ alignItems: 'stretch' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className={styles.select} value={activeId ?? ''} onChange={(e) => e.target.value && openConv(e.target.value)}>
            <option value="">New conversation</option>
            {convs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className={styles.input} style={{ flex: 1 }}
            placeholder='e.g. "How did sales perform this month?"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
          />
          <button className={styles.btn} onClick={ask} disabled={busy || !input.trim()}>{busy ? '…' : 'Ask'}</button>
        </div>
      </div>

      {msg && <p className={styles.error}>{msg}</p>}

      <div className={shell.card} style={{ minHeight: 360, display: 'flex', flexDirection: 'column' }}>
        {current.length === 0 ? (
          <p className={styles.empty}>Ask the copilot a question about your business.</p>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {current.map((m, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div className={styles.badge} style={{ marginBottom: 4 }}>
                  {m.role === 'USER' ? 'You' : m.role === 'TOOL' ? 'Tool' : 'Copilot'}
                </div>
                <p className={shell.mono} style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{m.content}</p>
                {m.records && m.records.length > 0 && (
                  <details>
                    <summary style={{ cursor: 'pointer' }}>Evidence ({m.records.length} records)</summary>
                    <pre className={shell.mono}>{JSON.stringify(m.records.slice(0, 8), null, 1)}</pre>
                  </details>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
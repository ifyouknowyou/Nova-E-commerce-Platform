'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable, fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Agent { key: string; name: string; description: string; tools: string[]; }
interface RunResult { runId: string; agent: string; status: string; approvals: string[]; output?: unknown[]; }
interface RunRow { id: string; agentKey: string; status: string; brief: string; startedAt: string; }

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function refresh() {
    apiFetch<Agent[]>('/ai/agents').then(setAgents).catch((e) => setMsg(e instanceof Error ? e.message : 'Failed'));
    apiFetch<RunRow[]>('/ai/agents/runs').then(setRuns).catch(() => undefined);
  }
  useEffect(() => { refresh(); }, []);

  async function runAgent(key: string) {
    const prompt = prompts[key]?.trim();
    if (!prompt) return;
    setRunning(key); setMsg(null);
    try {
      const res = await apiFetch<RunResult>(`/ai/agents/${key}/run`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      setMsg(
        res.status === 'NEEDS_APPROVAL'
          ? `⚠️ ${res.agent} proposed ${res.approvals.length} action(s) awaiting approval. Check Approvals.`
          : `${res.agent} completed: ${JSON.stringify(res.output)}`,
      );
      refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Failed'); }
    finally { setRunning(null); }
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>AI Agents</h1>
      <p className={shell.lede}>Autonomous workers with defined permissions — high-risk actions always require human approval.</p>

      {msg && <p className={styles.error}>{msg}</p>}

      <div className={styles.grid}>
        {agents.map((a) => (
          <div className={shell.card} key={a.key}>
            <h2 className={shell.cardTitle}>{a.name}</h2>
            <p>{a.description}</p>
            <div className={styles.row}><span>Scope</span><strong>{a.tools.join(', ')}</strong></div>
            <div className={styles.form} style={{ marginTop: 8 }}>
              <input
                className={styles.input}
                placeholder={`Brief the ${a.name.toLowerCase()}…`}
                value={prompts[a.key] ?? ''}
                onChange={(e) => setPrompts((p) => ({ ...p, [a.key]: e.target.value }))}
              />
              <button className={styles.btn} disabled={running === a.key} onClick={() => runAgent(a.key)}>
                {running === a.key ? '…' : 'Run'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Recent runs</h2>
        <DataTable
          columns={[
            { key: 'agent', label: 'Agent', render: (r) => <span className={styles.badge}>{r.agentKey}</span> },
            { key: 'status', label: 'Status', render: (r) => <span className={r.status === 'COMPLETED' ? styles.badgeDone : styles.badgeOpen}>{r.status}</span> },
            { key: 'brief', label: 'Brief', render: (r) => String(r.brief).slice(0, 60) },
            { key: 'at', label: 'When', render: (r) => fmtDate(r.startedAt) },
          ]}
          rows={runs as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
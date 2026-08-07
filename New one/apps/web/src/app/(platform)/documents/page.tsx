'use client';

import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api/client';
import { DataTable, fmtDate } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Doc { id: string; name: string; mimeType: string; size: number; createdAt: string; }
interface Folder { id: string; name: string; }

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderName, setFolderName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    apiFetch<Doc[]>('/documents').then(setDocs).catch(() => undefined);
    apiFetch<Folder[]>('/documents/folders').then(setFolders).catch(() => undefined);
  };
  useEffect(() => { load(); }, []);

  async function makeFolder() {
    await apiFetch('/documents/folders', { method: 'POST', body: JSON.stringify({ name: folderName }) });
    setFolderName(''); load();
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_URL}/documents/upload`, { method: 'POST', credentials: 'include', body: fd });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMsg((body as { message?: string }).message ?? 'Upload failed');
    } else {
      setMsg('Uploaded.');
    }
    setBusy(false);
    load();
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Documents</h1>
      <p className={shell.lede}>Real storage with MIME validation and version history.</p>
      {msg && <p className={styles.lede}>{msg}</p>}

      <div className={styles.form}>
        <input className={styles.input} placeholder="New folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
        <button className={styles.btn} onClick={makeFolder}>Create folder</button>
        <label className={`${styles.btn} ${styles.select}`}>
          {busy ? 'Uploading…' : 'Upload file'}
          <input type="file" hidden onChange={onUpload} />
        </label>
      </div>
      <p className={styles.empty}>Allowed: pdf, png/jpg, csv, json, txt/md, docx, xlsx (≤10MB).</p>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Folders</h2>
        {folders.map((f) => <span key={f.id} className={styles.badge} style={{ marginRight: 6 }}>{f.name}</span>)}
        {!folders.length && <span className={styles.empty}>No folders.</span>}
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Files</h2>
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: (r) => r.name },
            { key: 'mime', label: 'Type', render: (r) => r.mimeType },
            { key: 'size', label: 'Size', render: (r) => `${Math.round(Number(r.size) / 1024)}KB` },
            { key: 'up', label: 'Added', render: (r) => fmtDate(r.createdAt) },
            { key: 'dl', label: '', render: (r) => <a href={`${API_URL}/documents/${String(r.id)}/download`} download>dl</a> },
          ]}
          rows={docs as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
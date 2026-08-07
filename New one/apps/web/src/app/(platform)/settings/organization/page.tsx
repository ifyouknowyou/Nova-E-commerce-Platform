'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import styles from '../../platform.module.css';

interface Member {
  id: string;
  user: { email: string; name: string | null };
  roles: { role: { code: string; name: string } }[];
}

export default function OrganizationSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invite, setInvite] = useState({ email: '', roleCode: 'SUPPORT' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Member[]>('/orgs/members').then(setMembers).catch(() => undefined);
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/orgs/members/invite', { method: 'POST', body: JSON.stringify(invite) });
      setInvite({ email: '', roleCode: 'SUPPORT' });
      setError('Invite sent (see dev mail outbox for the accept link).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Organization</h1>
      <p className={styles.lede}>Members, roles, and invites.</p>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Members</h2>
        {members.map((m) => (
          <div className={styles.row} key={m.id}>
            <div>
              <div>{m.user.name ?? m.user.email}</div>
              <div className={styles.mono}>{m.user.email}</div>
            </div>
            <div>{m.roles.map((r) => (
              <span className={styles.badge} key={r.role.code}>{r.role.name}</span>
            ))}</div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Invite a member</h2>
        <form onSubmit={sendInvite} className={styles.stack}>
          <input className={styles.input} type="email" placeholder="email@company.com" value={invite.email}
            onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))} />
          <select className={styles.select} value={invite.roleCode}
            onChange={(e) => setInvite((i) => ({ ...i, roleCode: e.target.value }))}>
            {['ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'OPERATIONS', 'HR', 'SUPPORT'].map((r) => <option key={r}>{r}</option>)}
          </select>
          <button className={styles.btn} type="submit">Send invite</button>
        </form>
      </div>
    </div>
  );
}
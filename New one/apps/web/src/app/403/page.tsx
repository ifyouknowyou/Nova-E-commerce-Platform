import Link from 'next/link';
import styles from './notice.module.css';

export const metadata = { title: '403' };

export default function ForbiddenPage() {
  return (
    <main className={styles.notice}>
      <h1 className={styles.title}>403 — Access denied</h1>
      <p className={styles.body}>Your role doesn’t permit this action. Ask an OWNER/ADMIN if you believe this is a mistake.</p>
      <p className={styles.cta}><Link href="/dashboard">Back to dashboard</Link></p>
    </main>
  );
}

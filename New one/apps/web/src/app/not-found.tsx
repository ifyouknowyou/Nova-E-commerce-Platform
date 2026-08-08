import Link from 'next/link';
import styles from '../app/403/notice.module.css';

export default function NotFound() {
  return (
    <main className={styles.notice}>
      <h1 className={styles.title}>404 — Not found</h1>
      <p className={styles.body}>The page or resource you requested doesn’t exist.</p>
      <p className={styles.cta}><Link href="/dashboard">Back to dashboard</Link></p>
    </main>
  );
}
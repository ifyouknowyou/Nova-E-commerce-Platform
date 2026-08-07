import Link from 'next/link';

export const metadata = { title: '403' };

export default function ForbiddenPage() {
  return (
    <main style={{ padding: '4rem 2rem', maxWidth: 560, margin: '0 auto' }}>
      <h1>403 — Access denied</h1>
      <p>Your role doesn’t permit this action. Ask an OWNER/ADMIN if you believe this is a mistake.</p>
      <p><Link href="/dashboard">Back to dashboard</Link></p>
    </main>
  );
}
import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '4rem 2rem', maxWidth: 560, margin: '0 auto' }}>
      <h1>404 — Not found</h1>
      <p>The page or resource you requested doesn’t exist.</p>
      <p><Link href="/dashboard">Back to dashboard</Link></p>
    </main>
  );
}
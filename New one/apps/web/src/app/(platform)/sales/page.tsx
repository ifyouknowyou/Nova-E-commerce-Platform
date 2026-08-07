'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable, money } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface Product { id: string; name: string; sku: string | null; price: string; active: boolean; }
interface Quote { id: string; number: string; status: string; total: string; }

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    apiFetch<Product[]>('/sales/products').then(setProducts).catch(() => undefined);
    apiFetch<Quote[]>('/sales/quotes').then(setQuotes).catch(() => undefined);
  }, []);

  async function addProduct() {
    await apiFetch('/sales/products', { method: 'POST', body: JSON.stringify({ name, price: Number(price) }) });
    setName(''); setPrice('');
    setProducts(await apiFetch<Product[]>('/sales/products'));
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Sales</h1>
      <p className={shell.lede}>Products and quotes — totals are computed on the server.</p>

      <div className={styles.form}>
        <input className={styles.input} placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={styles.input} placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button className={styles.btn} onClick={addProduct}>Add product</button>
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Products</h2>
        <DataTable
          columns={[
            { key: 'name', label: 'Name', render: (r) => r.name },
            { key: 'prev', label: 'SKU', render: (r) => r.sku ?? '—' },
            { key: 'price', label: 'Price', render: (r) => money(r.price) },
          ]}
          rows={products as unknown as Record<string, unknown>[]}
        />
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Quotes</h2>
        <DataTable
          columns={[
            { key: 'number', label: 'Number', render: (r) => r.number },
            { key: 'status', label: 'Status', render: (r) => <span className={styles.badge}>{r.status}</span> },
            { key: 'total', label: 'Total', render: (r) => money(r.total) },
          ]}
          rows={quotes as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
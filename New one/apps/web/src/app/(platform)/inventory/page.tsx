'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { DataTable } from '@/components/data/table';
import styles from '@/components/data/data.module.css';
import shell from '../platform.module.css';

interface StockRow {
  id: string; productId: string; locationId: string; qty: number;
  productName: string; reorderLevel: number; sku: string | null;
}
interface Product { id: string; name: string; }
interface Location { id: string; name: string; }

export default function InventoryPage() {
  const [stock, setStock] = useState<StockRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [qty, setQty] = useState('');
  const [type, setType] = useState('IN');
  const [msg, setMsg] = useState<string | null>(null);
  const [lowOnly, setLowOnly] = useState(false);

  const load = () => {
    apiFetch<StockRow[]>(`/inventory/stock${lowOnly ? '?lowOnly=true' : ''}`).then(setStock).catch(() => undefined);
    apiFetch<Product[]>('/sales/products').then(setProducts).catch(() => undefined);
    apiFetch<Location[]>('/inventory/locations').then(setLocations).catch(() => undefined);
  };

  useEffect(load, [lowOnly]);

  async function record() {
    setMsg(null);
    try {
      await apiFetch('/inventory/stock/movements', {
        method: 'POST', body: JSON.stringify({ productId, locationId, type, qty: Number(qty) }),
      });
      setQty('');
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <div className={shell.page}>
      <h1 className={shell.h1}>Inventory</h1>
      <p className={shell.lede}>Stock levels + immutable movement ledger (no negative stock).</p>
      {msg && <p className={styles.error}>{msg}</p>}

      <div className={styles.form}>
        <select className={styles.select} value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Product…</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={styles.select} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">Location…</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
          <option>IN</option><option>OUT</option><option>ADJUSTMENT</option>
        </select>
        <input className={styles.input} type="number" placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
        <button className={styles.btn} onClick={record}>Record movement</button>
        <label className={styles.row}><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only</label>
      </div>

      <div className={shell.card}>
        <h2 className={shell.cardTitle}>Stock levels</h2>
        <DataTable
          columns={[
            { key: 'productName', label: 'Product', render: (r) => r.productName },
            { key: 'sku', label: 'SKU', render: (r) => r.sku ?? '—' },
            { key: 'qty', label: 'Qty', render: (r) => r.qty },
            { key: 'reorder', label: 'Reorder at', render: (r) => r.reorderLevel },
            { key: 'flag', label: '', render: (r) => (r.qty <= r.reorderLevel ? <span className={styles.badge}>LOW</span> : '') },
          ]}
          rows={stock as unknown as Record<string, unknown>[]}
        />
      </div>
    </div>
  );
}
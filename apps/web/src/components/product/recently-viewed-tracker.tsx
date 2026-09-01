'use client';

import { useEffect } from 'react';
import type { PublicProduct } from '@/lib/api/types';

const STORAGE_KEY = 'nova_recently_viewed';
const MAX_ITEMS = 10;

function trackRecentlyViewed(product: PublicProduct): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const list: PublicProduct[] = stored ? JSON.parse(stored) : [];
    const filtered = list.filter((p) => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

export function RecentlyViewedTracker({ product }: { product: PublicProduct }) {
  useEffect(() => {
    trackRecentlyViewed(product);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

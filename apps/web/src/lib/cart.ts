'use client';

import { apiFetch } from '@/lib/api';
import type { CartResponse } from '@/lib/api/types';

const SESSION_KEY = 'nova_session_token';

/** Get (or create) the guest cart session token, persisted in localStorage. */
export function getSessionToken(): string {
  if (typeof window === 'undefined') return '';
  let token = window.localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

function cartHeaders(): Record<string, string> {
  return { 'x-session-token': getSessionToken() };
}

export const cartApi = {
  get(): Promise<CartResponse> {
    return apiFetch<CartResponse>('/cart', { headers: cartHeaders() });
  },

  add(productId: string, quantity = 1): Promise<CartResponse> {
    return apiFetch<CartResponse>('/cart/items', {
      method: 'POST',
      headers: cartHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
  },

  update(itemId: string, data: { quantity?: number; savedForLater?: boolean }): Promise<CartResponse> {
    return apiFetch<CartResponse>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: cartHeaders(),
      body: JSON.stringify(data),
    });
  },

  remove(itemId: string): Promise<CartResponse> {
    return apiFetch<CartResponse>(`/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: cartHeaders(),
    });
  },

  merge(): Promise<CartResponse> {
    return apiFetch<CartResponse>('/cart/merge', {
      method: 'POST',
      headers: cartHeaders(),
    });
  },
};

import { apiFetch } from '@/lib/api';

export const paymentsApi = {
  start(orderId: string): Promise<{ orderId: string; provider: string; clientSecret?: string }> {
    return apiFetch(`/payments/${orderId}/start`, { method: 'POST' });
  },
  confirm(orderId: string): Promise<{ message: string; paymentStatus: string }> {
    return apiFetch(`/payments/${orderId}/confirm`, { method: 'POST' });
  },
};
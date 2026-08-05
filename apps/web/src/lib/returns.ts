import { apiFetch } from '@/lib/api';
import type { PaginatedResult } from '@/lib/api/types';

export interface ReturnRequest {
  id: string;
  orderItemId: string;
  productName: string;
  quantity: number;
  amount: number;
  reason: string;
  description: string | null;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  adminNote: string | null;
  createdAt: string;
}

export const returnsApi = {
  create(input: { orderItemId: string; reason: string; description?: string; amount?: number }): Promise<ReturnRequest> {
    return apiFetch('/returns', { method: 'POST', body: JSON.stringify(input) });
  },
  mine(): Promise<ReturnRequest[]> {
    return apiFetch('/returns/mine');
  },
  list(page = 1, pageSize = 20, status?: string): Promise<PaginatedResult<ReturnRequest>> {
    const statusParam = status ? `&status=${status}` : '';
    return apiFetch(`/returns?page=${page}&pageSize=${pageSize}${statusParam}`);
  },
  decide(id: string, decision: 'APPROVED' | 'REJECTED', adminNote?: string): Promise<ReturnRequest> {
    return apiFetch(`/returns/${id}/decide`, { method: 'PATCH', body: JSON.stringify({ decision, adminNote }) });
  },
};

import { apiFetch } from '@/lib/api';
import type { PaginatedResult } from '@/lib/api/types';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list(page = 1, pageSize = 20): Promise<PaginatedResult<Notification>> {
    return apiFetch(`/notifications?page=${page}&pageSize=${pageSize}`);
  },
  unreadCount(): Promise<{ unread: number }> {
    return apiFetch('/notifications/unread-count');
  },
  markRead(id: string): Promise<unknown> {
    return apiFetch(`/notifications/${id}/read`, { method: 'POST' });
  },
  markAllRead(): Promise<unknown> {
    return apiFetch('/notifications/read-all', { method: 'POST' });
  },
};

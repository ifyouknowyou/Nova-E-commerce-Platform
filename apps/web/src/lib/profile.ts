import { API_URL, apiFetch, getCookie } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarKey: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  status: string;
  roles: string[];
  createdAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatarKey?: string;
}

export interface SecurityStatus {
  emailVerified: boolean;
  hasPassword: boolean;
  googleLinked: boolean;
  lastLoginAt: string | null;
  status: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  orderEvents: boolean;
  marketing: boolean;
  security: boolean;
  lowStock: boolean;
}

export const usersApi = {
  me(): Promise<UserProfile> {
    return apiFetch<UserProfile>('/users/me');
  },
  update(input: UpdateProfileInput): Promise<UserProfile> {
    return apiFetch<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(input) });
  },
  async uploadAvatar(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const csrf = getCookie('nova_csrf');
    const res = await fetch(`${API_URL}/uploads/images`, {
      method: 'POST',
      credentials: 'include',
      body: form,
      headers: csrf ? { 'X-CSRF-Token': csrf } : {},
    });
    if (!res.ok) throw new Error('Avatar upload failed');
    const body = (await res.json()) as { key: string };
    return body.key;
  },
  security(): Promise<SecurityStatus> {
    return apiFetch<SecurityStatus>('/users/me/security');
  },
  permissions(): Promise<{ permissions: string[] }> {
    return apiFetch<{ permissions: string[] }>('/users/me/permissions');
  },
  preferences(): Promise<NotificationPreferences> {
    return apiFetch<NotificationPreferences>('/users/me/preferences');
  },
  updatePreferences(input: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return apiFetch<NotificationPreferences>('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};

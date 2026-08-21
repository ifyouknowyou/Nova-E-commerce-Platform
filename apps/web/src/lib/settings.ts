import { apiFetch } from '@/lib/api';

export type GroupedSettings = Record<string, Record<string, unknown>>;

export const settingsApi = {
  /** Public (no auth) — safe groups only. */
  public(): Promise<GroupedSettings> {
    return apiFetch('/settings/public');
  },
  /** Admin — full settings. */
  all(): Promise<GroupedSettings> {
    return apiFetch('/settings');
  },
  update(group: string, values: Record<string, unknown>): Promise<GroupedSettings> {
    return apiFetch(`/settings/${group}`, { method: 'PUT', body: JSON.stringify(values) });
  },
};

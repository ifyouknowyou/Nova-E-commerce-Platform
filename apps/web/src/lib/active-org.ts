/**
 * Active Control Center organization id. The org switcher writes here so every
 * Control Center API call can send `x-organization-id` and server components can
 * read it from a cookie. Mirrors the value to localStorage + a cookie so it
 * survives navigation and is available to server-side fetches.
 */
const STORAGE_KEY = 'nova:org';
const COOKIE = 'nova_org_id';

let activeOrgId: string | null = null;

export function getActiveOrgId(): string | null {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(STORAGE_KEY) ?? activeOrgId;
  }
  return activeOrgId;
}

export function setActiveOrgId(id: string): void {
  activeOrgId = id;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, id);
    document.cookie = `${COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }
}

/** Reads the active org id from the cookie (server-side helpers). */
export function readOrgIdFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

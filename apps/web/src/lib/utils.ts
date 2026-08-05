import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as a currency string. */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** Restrict a redirect target to an internal path, preventing open redirects. */
export function safeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback; // e.g. "https://evil.example"
  if (value.startsWith('//')) return fallback; // protocol-relative
  if (value.includes(':')) return fallback; // scheme like "https:"
  if (value.includes('\\')) return fallback; // backslash abuse
  return value;
}

/** Format an ISO date/time string for display. */
export function formatDate(iso: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  }).format(date);
}

/** Slugify a string (used for client-side URL generation). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

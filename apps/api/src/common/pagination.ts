import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@nova/shared';

/**
 * Robust query-param parsing for list endpoints. Malformed values (NaN,
 * negatives, decimals) fall back to safe defaults instead of producing an
 * unhandled 500 via a bad Prisma skip/take.
 */
export function parsePage(input?: string): number {
  const n = Number(input);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export function parsePageSize(input?: string, fallback = DEFAULT_PAGE_SIZE): number {
  const n = Number(input);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, MAX_PAGE_SIZE);
}

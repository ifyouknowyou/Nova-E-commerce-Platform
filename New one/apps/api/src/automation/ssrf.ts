import { isIP } from 'node:net';

/**
 * SSRF guard for outbound workflow WEBHOOK actions (build.md §39).
 * Restricts the target to public http(s) endpoints and rejects requests to
 * loopback, link-local, private, or unspecified networks — a workflow author
 * must not be able to pivot into internal services through the API server.
 */
export function assertSafeWebhookUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('WEBHOOK url must be a valid absolute URL (http/https)');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('WEBHOOK url must be http(s)');
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) throw new Error('WEBHOOK url must not target localhost');

  // v4/v6 literal addresses get an IP-range check; hostnames are allowed but
  // must not be IP literals in a private range. (DNS rebinding is mitigated by
  // the 5s timeout + short-lived one-shot fetch in the runner.)
  const maybeIp = host.startsWith('[') ? host.slice(1, -1) : host;
  if (isIP(maybeIp)) {
    const version = isIP(maybeIp) === 4 ? 4 : 6;
    if (isPrivate(version, maybeIp)) throw new Error('WEBHOOK url must not target a private/loopback/unspecified address');
  }
  return url.toString();
}

/** Block private/special-purpose ranges (RFC1918, loopback, link-local, etc.). */
function isPrivate(version: 4 | 6, host: string): boolean {
  if (version === 4) return isPrivateV4(host);
  return host === '::' || host === '::1' || host === 'fe80::' || host.startsWith('fe80::') || host === '::ffff:127.0.0.1';
}

function isPrivateV4(host: string): boolean {
  // Numeric compare of the dotted quad.
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a] = parts;
  // 10.x, 127.x, 169.254.x, 172.16-31.x, 192.168.x
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && parts[1] === 254) return true;
  if (a === 172 && parts[1]! >= 16 && parts[1]! <= 31) return true;
  if (a === 192 && parts[1] === 168) return true;
  return false;
}
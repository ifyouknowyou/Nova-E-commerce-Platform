import { assertSafeWebhookUrl } from './ssrf';

describe('SSRF guard — WEBHOOK workflow action', () => {
  it('allows public https URLs', () => {
    expect(assertSafeWebhookUrl('https://hooks.example.com/cb')).toBe('https://hooks.example.com/cb');
  });

  it('allows public http URLs', () => {
    expect(assertSafeWebhookUrl('http://example.com/cb')).toBe('http://example.com/cb');
  });

  it('rejects loopback + localhost', () => {
    expect(() => assertSafeWebhookUrl('http://localhost:4000/x')).toThrow();
    expect(() => assertSafeWebhookUrl('http://127.0.0.1/x')).toThrow();
    expect(() => assertSafeWebhookUrl('http://[::1]/x')).toThrow();
  });

  it('rejects private RFC1918 ranges', () => {
    expect(() => assertSafeWebhookUrl('http://10.0.0.1/x')).toThrow();
    expect(() => assertSafeWebhookUrl('http://172.16.0.1/x')).toThrow();
    expect(() => assertSafeWebhookUrl('http://192.168.1.1/x')).toThrow();
  });

  it('rejects non-http schemes and invalid urls', () => {
    expect(() => assertSafeWebhookUrl('file:///etc/passwd')).toThrow();
    expect(() => assertSafeWebhookUrl('ftp://example.com/x')).toThrow();
    expect(() => assertSafeWebhookUrl('not a url')).toThrow();
  });
});

/** Build a public URL for a locally-stored object key. */
export function mediaUrl(key: string): string {
  const baseUrl = process.env.UPLOADS_BASE_URL ?? '/uploads';
  return `${baseUrl.replace(/\/$/, '')}/${key}`;
}

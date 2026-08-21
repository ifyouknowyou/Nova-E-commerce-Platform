/** Build a public URL for an S3/MinIO object key. */
export function mediaUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
  const bucket = process.env.S3_BUCKET ?? 'nova-media';
  return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
}

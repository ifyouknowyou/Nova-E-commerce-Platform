import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
}

/**
 * Sniff the real image type from the FILE BYTES, never from the client-supplied
 * MIME type. A polyglot (e.g. HTML disguised as image/gif) is rejected because
 * its magic bytes do not match a real image header.
 */
function sniffImageType(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpeg' };
  }
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return { mime: 'image/gif', ext: 'gif' };
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;

  constructor() {
    // Use /tmp for uploads in production, ./uploads for local dev
    this.uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/nova-uploads' : join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /** Validate + upload an image buffer. Type is derived from bytes. */
  async uploadImage(userId: string, buffer: Buffer, _clientMimeType: string): Promise<UploadResult> {
    if (buffer.byteLength === 0) throw new BadRequestException('Empty file');
    if (buffer.byteLength > MAX_SIZE) throw new BadRequestException('Image exceeds the 5 MB limit');

    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      throw new BadRequestException('File contents are not a supported image (JPEG, PNG, WebP or GIF)');
    }

    const key = `images/${userId}/${randomUUID()}.${sniffed.ext}`;
    const filePath = join(this.uploadDir, key);

    // Ensure directory exists
    const dir = join(this.uploadDir, `images/${userId}`);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write file
    writeFileSync(filePath, buffer);

    // Return URL - in production use /uploads path, locally use relative path
    const baseUrl = process.env.UPLOADS_BASE_URL ?? '/uploads';
    const url = `${baseUrl.replace(/\/$/, '')}/${key}`;

    this.logger.debug(`Uploaded image: ${key}`);

    return {
      key,
      url,
      contentType: sniffed.mime,
    };
  }

  /** Delete an image file - best-effort */
  async deleteImage(key: string): Promise<void> {
    try {
      const filePath = join(this.uploadDir, key);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.debug(`Deleted image: ${key}`);
      }
    } catch (err) {
      this.logger.warn(`Could not delete image ${key}: ${(err as Error).message}`);
    }
  }
}

import { BadRequestException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { CONFIG, type AppConfig } from '../config/configuration';

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
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }
  // GIF87a / GIF89a
  const head = buf.toString('ascii', 0, 6);
  if (head === 'GIF87a' || head === 'GIF89a') {
    return { mime: 'image/gif', ext: 'gif' };
  }
  // WebP: "RIFF" ... "WEBP"
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private client: S3Client;

  constructor(@Inject(CONFIG) private readonly config: AppConfig) {
    this.client = new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint,
      credentials: { accessKeyId: config.s3AccessKey, secretAccessKey: config.s3SecretKey },
      forcePathStyle: config.s3ForcePathStyle,
    });
  }

  async onModuleInit(): Promise<void> {
    const bucket = this.config.s3Bucket;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
        this.logger.log(`Created S3 bucket "${bucket}"`);
      } catch (err) {
        this.logger.warn(`Could not ensure bucket: ${(err as Error).message}`);
      }
    }

    // Product images are public by design — grant public read so <img> URLs work.
    try {
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          }),
        }),
      );
    } catch (err) {
      this.logger.warn(`Could not set public-read policy: ${(err as Error).message}`);
    }
  }

  /** Validate + upload an image buffer. Type is derived from bytes, key is bound to the uploader. */
  async uploadImage(userId: string, buffer: Buffer, _clientMimeType: string): Promise<UploadResult> {
    if (buffer.byteLength === 0) throw new BadRequestException('Empty file');
    if (buffer.byteLength > MAX_SIZE) throw new BadRequestException('Image exceeds the 5 MB limit');

    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      throw new BadRequestException('File contents are not a supported image (JPEG, PNG, WebP or GIF)');
    }

    const key = `images/${userId}/${randomUUID()}.${sniffed.ext}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: sniffed.mime,
        // Browsers will not sniff the object as anything other than its image type.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      key,
      url: `${this.config.s3Endpoint.replace(/\/$/, '')}/${this.config.s3Bucket}/${key}`,
      contentType: sniffed.mime,
    };
  }

  /** Delete an object (best-effort) — used when a product image row is removed. */
  async deleteImage(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.config.s3Bucket, Key: key }));
    } catch (err) {
      this.logger.warn(`Could not delete S3 object ${key}: ${(err as Error).message}`);
    }
  }
}


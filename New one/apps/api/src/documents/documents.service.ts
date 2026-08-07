import { Injectable } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions';

const UPLOAD_ROOT = resolve(__dirname, '../../../var/uploads');

/** Allowed file extensions → MIME types. Uploads outside this are rejected. */
const ALLOWED: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function storageKeyFor(orgId: string): { dir: string; key: string } {
  const dir = resolve(UPLOAD_ROOT, orgId);
  mkdirSync(dir, { recursive: true });
  return { dir, key: randomUUID() };
}

export function resolveUploadPath(orgId: string, storageKey: string): string {
  // storageKey is a bare uuid (no traversal), safe to resolve under the org dir.
  if (!/^[0-9a-f-]{36}$/i.test(storageKey)) throw new ApiException('NOT_FOUND');
  return resolve(UPLOAD_ROOT, orgId, storageKey);
}

export function detectMime(originalName: string): string | null {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED[ext] ?? null;
}

/**
 * Documents — folders + files with real disk storage, MIME validation, and
 * immutable version history. Storage keys are bare uuids under var/uploads/<orgId>.
 */
@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async folders(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.documentFolder.findMany({ where: { orgId }, orderBy: { name: 'asc' } }));
  }
  async createFolder(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.documentFolder.create({ data: { ...data, orgId } as never }));
  }

  async documents(orgId: string, folderId?: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.document.findMany({ where: { orgId, ...(folderId ? { folderId } : {}) }, orderBy: { createdAt: 'desc' } }),
    );
  }

  /**
   * Persist an uploaded file. Writes bytes to disk (bare uuid key) and records a
   * Document + immutable DocumentVersion. Throws if the MIME isn't allowed.
   */
  async upload(orgId: string, ownerId: string | undefined, file: { originalname: string; size: number; buffer: Buffer }, folderId?: string) {
    const mimeType = detectMime(file.originalname);
    if (!mimeType) throw new ApiException('VALIDATION_FAILED', { message: 'file type not allowed' });
    if (file.size > 10 * 1024 * 1024) throw new ApiException('VALIDATION_FAILED', { message: 'file exceeds 10MB limit' });

    const { dir, key } = storageKeyFor(orgId);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(resolve(dir, key), file.buffer);

    const base = file.originalname.replace(/\.[^.]+$/, '');
    const name = `${base}-${key.slice(0, 6)}.${file.originalname.split('.').pop()}`;

    return this.prisma.withTenant(orgId, async (tx) => {
      const doc = await tx.document.create({
        data: { orgId, folderId, name, mimeType, size: file.size, storageKey: key, version: 1, ownerId },
      });
      await tx.documentVersion.create({
        data: { orgId, documentId: doc.id, version: 1, size: file.size, mimeType, storageKey: key, createdById: ownerId },
      });
      return doc;
    });
  }

  /** Push a new version: writes new bytes, bumps Document.version, appends history. */
  async newVersion(orgId: string, documentId: string, ownerId: string | undefined, file: { originalname: string; size: number; buffer: Buffer }) {
    const doc = await this.prisma.withTenant(orgId, (tx) => tx.document.findFirst({ where: { id: documentId, orgId } }));
    if (!doc) throw new ApiException('NOT_FOUND');
    const mimeType = detectMime(file.originalname);
    if (!mimeType) throw new ApiException('VALIDATION_FAILED', { message: 'file type not allowed' });

    const { dir, key } = storageKeyFor(orgId);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(resolve(dir, key), file.buffer);

    const next = doc.version + 1;
    return this.prisma.withTenant(orgId, async (tx) => {
      await tx.document.update({ where: { id: documentId }, data: { version: next, size: file.size, mimeType, storageKey: key } });
      await tx.documentVersion.create({
        data: { orgId, documentId, version: next, size: file.size, mimeType, storageKey: key, createdById: ownerId },
      });
      return tx.document.findFirst({ where: { id: documentId } });
    });
  }

  async versions(orgId: string, documentId: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.documentVersion.findMany({ where: { orgId, documentId }, orderBy: { version: 'desc' } }),
    );
  }

  /** Open a readable stream for a stored version (tenant + key validated). */
  stream(orgId: string, doc: { storageKey: string; mimeType: string; name: string }) {
    const abs = resolveUploadPath(orgId, doc.storageKey);
    if (!existsSync(abs)) throw new ApiException('NOT_FOUND');
    return { stream: createReadStream(abs), mimeType: doc.mimeType, name: doc.name };
  }

  async getMeta(orgId: string, documentId: string) {
    const doc = await this.prisma.withTenant(orgId, (tx) => tx.document.findFirst({ where: { id: documentId, orgId } }));
    if (!doc) throw new ApiException('NOT_FOUND');
    return doc;
  }

  async remove(orgId: string, id: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.document.deleteMany({ where: { id, orgId } }));
  }
}
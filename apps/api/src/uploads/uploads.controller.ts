import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { MAX_SIZE, UploadsService, type UploadResult } from './uploads.service';

/** Minimal multer file shape we rely on. */
export interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('images')
  // Only Sellers and Admins may write objects; CUSTOMERs get 403. Enforced at the
  // backend by the global RolesGuard (not frontend-only), on top of the existing
  // magic-byte validation, size limits, and per-user key binding.
  @Roles('SELLER', 'ADMIN')
  // Cap the request in multer (buffer) BEFORE the buffer is fully populated, so
  // an attacker cannot exhaust server memory with a giant multipart body.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE, files: 1 } }))
  uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: UploadedImageFile,
  ): Promise<UploadResult> {
    if (!file?.buffer) throw new BadRequestException('No file uploaded');
    return this.uploads.uploadImage(user.id, file.buffer, file.mimetype);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { DocumentsService } from './documents.service';

export interface UploadedFileMeta {
  originalname: string;
  size: number;
  buffer: Buffer;
}

interface DocReq {
  user?: AuthenticatedUser;
}

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get()
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'List documents.' })
  documents(@Req() req: DocReq) {
    return this.docs.documents(req.user!.orgId);
  }

  @Get('folders')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'List folders.' })
  folders(@Req() req: DocReq) {
    return this.docs.folders(req.user!.orgId);
  }

  @Post('folders')
  @RequirePermissions('documents.update')
  @ApiOperation({ summary: 'Create a folder.' })
  createFolder(@Req() req: DocReq, @Body() body: Record<string, unknown>) {
    return this.docs.createFolder(req.user!.orgId, body);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('documents.create')
  @ApiOperation({ summary: 'Upload a document (validated MIME, <10MB).' })
  upload(@Req() req: DocReq, @UploadedFile() file: UploadedFileMeta) {
    return this.docs.upload(req.user!.orgId, req.user!.userId, file);
  }

  @Post(':id/version')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('documents.update')
  @ApiOperation({ summary: 'Upload a new version of a document.' })
  newVersion(@Req() req: DocReq, @Param('id') id: string, @UploadedFile() file: UploadedFileMeta) {
    return this.docs.newVersion(req.user!.orgId, id, req.user!.userId, file);
  }

  @Get(':id/download')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'Download a document.' })
  async download(@Req() req: DocReq, @Param('id') id: string, @Res() res: Response) {
    const meta = await this.docs.getMeta(req.user!.orgId, id);
    const { stream, mimeType, name } = this.docs.stream(req.user!.orgId, meta);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    stream.pipe(res);
  }

  @Get(':id/versions')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'Document version history.' })
  versions(@Req() req: DocReq, @Param('id') id: string) {
    return this.docs.versions(req.user!.orgId, id);
  }

  @Delete(':id')
  @RequirePermissions('documents.delete')
  @ApiOperation({ summary: 'Delete a document.' })
  remove(@Req() req: DocReq, @Param('id') id: string) {
    return this.docs.remove(req.user!.orgId, id);
  }
}
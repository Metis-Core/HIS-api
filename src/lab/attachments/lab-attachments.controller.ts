import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRole } from 'common/enums/userRoles.enum';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import type { UploadedFileLike } from 'common/storage/file-storage';
import { LabAttachmentsService } from './lab-attachments.service';

const contentDisposition = (name: string) =>
  `attachment; filename="${name.replace(/[^\x20-\x7e]|"/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`;

@Controller('lab/orders/:orderId/items/:itemId/attachments')
export class LabAttachmentsController {
  constructor(private readonly attachments: LabAttachmentsService) {}

  /** multipart/form-data with one `file`; size limit from ATTACHMENT_MAX_BYTES (default 10 MB). */
  @Post()
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @UploadedFile() file: UploadedFileLike | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attachments.upload(orderId, itemId, file, user.id);
  }

  @Get()
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  list(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.attachments.list(orderId, itemId);
  }

  @Get(':id/download')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  async download(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { attachment, content } = await this.attachments.download(
      orderId,
      itemId,
      id,
    );
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', String(content.length));
    res.setHeader(
      'Content-Disposition',
      contentDisposition(attachment.fileName),
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.end(content);
  }

  @Delete(':id')
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attachments.remove(orderId, itemId, id);
  }
}

import { ConfigService } from '@nestjs/config';
import type { MulterModuleOptions } from '@nestjs/platform-express';

export const DEFAULT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** No storage/dest means multer keeps the upload in memory, so nothing touches disk before it is checked. */
export const attachmentUploadOptions = (
  config: ConfigService,
): MulterModuleOptions => ({
  limits: {
    fileSize:
      Number(config.get<string>('ATTACHMENT_MAX_BYTES')) ||
      DEFAULT_ATTACHMENT_MAX_BYTES,
    files: 1,
    fields: 5,
  },
});

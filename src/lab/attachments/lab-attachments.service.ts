import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { FileStorage, UploadedFileLike } from 'common/storage/file-storage';
import { LabOrderItem } from '../entities/lab-order-item.entity';
import { LabOrderItemStatus as S } from '../enums/lab-order-item-status.enum';
import { detectFileType, safeFileName } from './detect-file-type';
import { LabAttachment } from './lab-attachment.entity';

export interface AttachmentDownload {
  attachment: LabAttachment;
  content: Buffer;
}

/** L8: files on a lab result. Type is decided by content; the client's name and type are not trusted. */
@Injectable()
export class LabAttachmentsService {
  constructor(
    @InjectRepository(LabAttachment)
    private readonly attachments: Repository<LabAttachment>,
    @InjectRepository(LabOrderItem)
    private readonly items: Repository<LabOrderItem>,
    private readonly storage: FileStorage,
  ) {}

  async upload(
    orderId: string,
    itemId: string,
    file: UploadedFileLike | undefined,
    uploadedById: string,
  ): Promise<LabAttachment> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Choose a file to attach');
    }
    const type = detectFileType(file.buffer);
    if (!type) {
      throw new UnsupportedMediaTypeException(
        'Only PDF, Word (.docx) or JPEG files can be attached',
      );
    }
    const item = await this.findItem(orderId, itemId);
    if (item.status === S.CANCELLED) {
      throw new ConflictException('This test was cancelled');
    }
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const storageKey = `lab/${now.getUTCFullYear()}/${month}/${randomUUID()}.${type.extension}`;
    await this.storage.put(storageKey, file.buffer);
    try {
      const saved = await this.attachments.save(
        this.attachments.create({
          itemId,
          fileName: safeFileName(file.originalname, type),
          mimeType: type.mimeType,
          sizeBytes: file.buffer.length,
          sha256: createHash('sha256').update(file.buffer).digest('hex'),
          storageKey,
          uploadedById,
        }),
      );
      // The storage location is internal; clients only ever download by id.
      return Object.assign(saved, { storageKey: undefined });
    } catch (error) {
      await this.storage.remove(storageKey);
      throw error;
    }
  }

  async list(orderId: string, itemId: string): Promise<LabAttachment[]> {
    await this.findItem(orderId, itemId);
    return this.attachments.find({
      where: { itemId },
      relations: { uploadedBy: true },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async download(
    orderId: string,
    itemId: string,
    id: string,
  ): Promise<AttachmentDownload> {
    await this.findItem(orderId, itemId);
    const attachment = await this.attachments
      .createQueryBuilder('file')
      .addSelect('file.storageKey')
      .where('file.id = :id AND file.itemId = :itemId', { id, itemId })
      .getOne();
    if (!attachment) throw new NotFoundException('Attachment not found');
    return {
      attachment,
      content: await this.storage.read(attachment.storageKey),
    };
  }

  // Soft delete: the file stays on disk so the audit trail can still be followed.
  async remove(orderId: string, itemId: string, id: string): Promise<void> {
    const item = await this.findItem(orderId, itemId);
    if (item.status === S.VERIFIED) {
      throw new ConflictException(
        'Attachments on a verified result are part of the record and cannot be removed',
      );
    }
    const result = await this.attachments.softDelete({ id, itemId });
    if (!result.affected) throw new NotFoundException('Attachment not found');
  }

  private async findItem(
    orderId: string,
    itemId: string,
  ): Promise<LabOrderItem> {
    const item = await this.items.findOne({ where: { id: itemId, orderId } });
    if (!item) throw new NotFoundException('Lab test not found on this order');
    return item;
  }
}

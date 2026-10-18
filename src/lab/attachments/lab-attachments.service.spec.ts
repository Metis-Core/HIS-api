import {
  ConflictException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileStorage, UploadedFileLike } from 'common/storage/file-storage';
import { LabOrderItem } from '../entities/lab-order-item.entity';
import { LabOrderItemStatus as S } from '../enums/lab-order-item-status.enum';
import { LabAttachment } from './lab-attachment.entity';
import { LabAttachmentsService } from './lab-attachments.service';

const attachments = {
  create: jest.fn((value: object) => value),
  save: jest.fn((value: object) => Promise.resolve({ id: 'a1', ...value })),
  softDelete: jest.fn(),
};
const items = { findOne: jest.fn() };
const storage = {
  put: jest.fn<Promise<void>, [string, Buffer]>(),
  read: jest.fn(),
  remove: jest.fn(),
};
const pdf = (name = 'report.pdf'): UploadedFileLike => ({
  originalname: name,
  mimetype: 'application/pdf',
  size: 12,
  buffer: Buffer.from('%PDF-1.7 abc'),
});

describe('LabAttachmentsService', () => {
  let service: LabAttachmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    items.findOne.mockResolvedValue({ id: 'i1', status: S.RESULT_READY });
    const module = await Test.createTestingModule({
      providers: [
        LabAttachmentsService,
        { provide: getRepositoryToken(LabAttachment), useValue: attachments },
        { provide: getRepositoryToken(LabOrderItem), useValue: items },
        { provide: FileStorage, useValue: storage },
      ],
    }).compile();
    service = module.get(LabAttachmentsService);
  });

  it('stores a PDF under a server-made key and hides the key from the response', async () => {
    // Arrange
    const file = pdf();

    // Act
    const saved = await service.upload('o1', 'i1', file, 'tech');

    // Assert
    const [key] = storage.put.mock.calls[0];
    expect(key).toMatch(/^lab\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.pdf$/);
    expect(saved).toMatchObject({
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12,
    });
    expect(saved.storageKey).toBeUndefined();
  });

  it('rejects content that is not an allowed type whatever its name says', async () => {
    // Arrange
    const file = { ...pdf('scan.pdf'), buffer: Buffer.from('<html></html>') };

    // Act
    const attempt = service.upload('o1', 'i1', file, 'tech');

    // Assert
    await expect(attempt).rejects.toThrow(UnsupportedMediaTypeException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('removes the stored file again when the database row cannot be saved', async () => {
    // Arrange
    attachments.save.mockRejectedValueOnce(new Error('db down'));

    // Act
    const attempt = service.upload('o1', 'i1', pdf(), 'tech');

    // Assert
    await expect(attempt).rejects.toThrow('db down');
    expect(storage.remove).toHaveBeenCalledWith(storage.put.mock.calls[0][0]);
  });

  it('refuses a test that is not on the order', async () => {
    // Arrange
    items.findOne.mockResolvedValue(null);

    // Act
    const attempt = service.upload('o1', 'other', pdf(), 'tech');

    // Assert
    await expect(attempt).rejects.toThrow(NotFoundException);
  });

  it('keeps attachments on a verified result', async () => {
    // Arrange
    items.findOne.mockResolvedValue({ id: 'i1', status: S.VERIFIED });

    // Act
    const attempt = service.remove('o1', 'i1', 'a1');

    // Assert
    await expect(attempt).rejects.toThrow(ConflictException);
    expect(attachments.softDelete).not.toHaveBeenCalled();
  });
});

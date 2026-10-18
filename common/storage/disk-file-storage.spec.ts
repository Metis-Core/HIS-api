import { ConfigService } from '@nestjs/config';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DiskFileStorage } from './disk-file-storage';

describe('DiskFileStorage', () => {
  let root: string;
  let storage: DiskFileStorage;

  beforeEach(async () => {
    jest.clearAllMocks();
    root = await mkdtemp(join(tmpdir(), 'his-attachments-'));
    const config = {
      get: jest.fn((key: string) =>
        key === 'ATTACHMENTS_DIR' ? root : undefined,
      ),
    };
    storage = new DiskFileStorage(config as unknown as ConfigService);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes and reads back the same bytes', async () => {
    // Arrange
    const content = Buffer.from('%PDF-1.7 report');

    // Act
    await storage.put('lab/2026/10/a.pdf', content);
    const read = await storage.read('lab/2026/10/a.pdf');

    // Assert
    expect(read.equals(content)).toBe(true);
  });

  it('never overwrites an existing file', async () => {
    // Arrange
    await storage.put('lab/x.pdf', Buffer.from('first'));

    // Act
    const second = storage.put('lab/x.pdf', Buffer.from('second'));

    // Assert
    await expect(second).rejects.toThrow(/EEXIST/);
  });

  it('refuses a key that escapes the storage folder', async () => {
    // Arrange
    const key = '../../etc/passwd';

    // Act
    const attempt = storage.read(key);

    // Assert
    await expect(attempt).rejects.toThrow('Invalid storage key');
  });

  it('reports a missing file as not found', async () => {
    // Arrange / Act
    const attempt = storage.read('lab/missing.pdf');

    // Assert
    await expect(attempt).rejects.toThrow('The stored file is missing');
  });
});

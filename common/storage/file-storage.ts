/** Where uploaded files live. Disk today; swap for object storage if the API runs on more than one host. */
export abstract class FileStorage {
  abstract put(key: string, content: Buffer): Promise<void>;
  abstract read(key: string): Promise<Buffer>;
  abstract remove(key: string): Promise<void>;
}

/** A multer memory-storage upload; typed here because @types/multer is not installed. */
export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

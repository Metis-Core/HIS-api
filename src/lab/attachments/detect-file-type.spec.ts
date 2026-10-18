import {
  DOCX,
  JPEG,
  PDF,
  detectFileType,
  safeFileName,
} from './detect-file-type';

const zipWith = (entry: string) =>
  Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.alloc(26),
    Buffer.from(entry),
  ]);

describe('detectFileType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['a PDF', Buffer.from('%PDF-1.7\n...'), PDF],
    ['a JPEG', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]), JPEG],
    ['a Word document', zipWith('word/document.xml'), DOCX],
  ])('recognises %s by its first bytes', (_label, content, expected) => {
    // Arrange / Act
    const type = detectFileType(content);

    // Assert
    expect(type).toBe(expected);
  });

  it.each([
    [
      'an HTML page renamed to .pdf',
      Buffer.from('<html><script>alert(1)</script>'),
    ],
    ['a ZIP that is not a Word document', zipWith('xl/workbook.xml')],
    ['a PNG', Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    ['an empty file', Buffer.alloc(0)],
  ])('rejects %s', (_label, content) => {
    // Arrange / Act
    const type = detectFileType(content);

    // Assert
    expect(type).toBeNull();
  });
});

describe('safeFileName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('drops any path, strips unsafe characters and uses the real extension', () => {
    // Arrange
    const original = '..\\..\\etc/passwd<script>.exe';

    // Act
    const name = safeFileName(original, PDF);

    // Assert
    expect(name).toBe('passwd_script_.pdf');
  });

  it('falls back to a generic name when nothing usable is left', () => {
    // Arrange / Act
    const name = safeFileName('////', JPEG);

    // Assert
    expect(name).toBe('attachment.jpg');
  });
});

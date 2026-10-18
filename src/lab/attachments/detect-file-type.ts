export interface DetectedFileType {
  mimeType: string;
  extension: string;
}

export const PDF: DetectedFileType = {
  mimeType: 'application/pdf',
  extension: 'pdf',
};
export const JPEG: DetectedFileType = {
  mimeType: 'image/jpeg',
  extension: 'jpg',
};
export const DOCX: DetectedFileType = {
  mimeType:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  extension: 'docx',
};

const startsWith = (content: Buffer, bytes: number[]) =>
  content.length >= bytes.length && bytes.every((b, i) => content[i] === b);

/**
 * L8 allow-list by content, not by the name or type the browser claims:
 * PDF (%PDF-), JPEG (FF D8 FF) and DOCX (a ZIP holding word/document.xml).
 */
export function detectFileType(content: Buffer): DetectedFileType | null {
  if (startsWith(content, [0x25, 0x50, 0x44, 0x46, 0x2d])) return PDF;
  if (startsWith(content, [0xff, 0xd8, 0xff])) return JPEG;
  const zip = startsWith(content, [0x50, 0x4b, 0x03, 0x04]);
  // Entry names are stored uncompressed in ZIP headers, so a byte search is enough.
  if (zip && content.includes('word/document.xml', 0, 'latin1')) return DOCX;
  return null;
}

/** A safe download name: no paths or control characters, and the real extension. */
export function safeFileName(original: string, type: DetectedFileType): string {
  const base = (original.split(/[\\/]/).pop() ?? '')
    .replace(/\.[^.]*$/, '')
    .replace(/[^\p{L}\p{N} ._()-]/gu, '_')
    .trim()
    .slice(0, 120);
  return `${base || 'attachment'}.${type.extension}`;
}

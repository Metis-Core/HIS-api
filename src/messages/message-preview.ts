const PREVIEW_LENGTH = 140;

/** A one-line preview for notifications. */
export function previewOf(body: string): string {
  const line = body.replace(/\s+/g, ' ').trim();
  return line.length > PREVIEW_LENGTH
    ? `${line.slice(0, PREVIEW_LENGTH - 1)}…`
    : line;
}

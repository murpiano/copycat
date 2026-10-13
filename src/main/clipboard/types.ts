export type ClipboardSnapshot =
  | { type: 'text'; content: string; hash: string }
  | { type: 'file'; paths: string[]; hash: string }
  | { type: 'image'; pngBuffer: Buffer; hash: string };

export interface ClipboardReader {
  hasFileDrop(): boolean;
  hasImage(): boolean;
  readText(): string;
  readImagePNG(): Buffer;
  readFileDropBuffer(): Buffer;
}

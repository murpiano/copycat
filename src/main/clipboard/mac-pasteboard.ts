/**
 * Finder puts copied files on the pasteboard as `NSFilenamesPboardType`: a
 * legacy but still-read binary-plist (bplist00) value holding an NSArray of
 * POSIX path NSStrings. Electron has no high-level "write file list" API for
 * macOS, so this builds and reads that exact byte format by hand — there is
 * no third format in between "raw DROPFILES" (Windows) and this.
 *
 * Only the shapes Finder actually produces for this format are supported:
 * a top-level array of ASCII or UTF-16 strings. Anything else decodes to an
 * empty array rather than throwing, since this runs inside a polling loop.
 */

const MAGIC = 'bplist00';

/** A single `public.file-url` pasteboard entry: a `file://`-prefixed,
 * percent-encoded URL, not a path — the fallback used when Finder's legacy
 * `NSFilenamesPboardType` (the format read first) isn't set. */
export function parseFileUrlBuffer(buf: Buffer): string[] {
  try {
    const url = buf.toString('utf8').trim();
    if (!url.startsWith('file://')) return [];
    return [decodeURIComponent(url.slice('file://'.length))];
  } catch {
    return [];
  }
}

function isAscii(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) return false;
  }
  return true;
}

function intByteLength(value: number): number {
  if (value < 0x100) return 1;
  if (value < 0x10000) return 2;
  if (value < 0x100000000) return 4;
  return 8;
}

function writeBigEndian(value: number, byteLength: number): Buffer {
  const buf = Buffer.alloc(byteLength);
  // All lengths/counts/offsets here are tiny (file lists, not file contents),
  // so a plain Number, written byte by byte, never loses precision.
  for (let i = byteLength - 1; i >= 0; i--) {
    buf[i] = value & 0xff;
    value = Math.floor(value / 256);
  }
  return buf;
}

/** The bplist "integer object": used both as a real object and, inline, as
 * the extended length/count prefix when a string or array has >= 15 items. */
function encodeIntObject(value: number): Buffer {
  const byteLength = intByteLength(value);
  const sizeNibble = { 1: 0, 2: 1, 4: 2, 8: 3 }[byteLength]!;
  return Buffer.concat([Buffer.from([0x10 | sizeNibble]), writeBigEndian(value, byteLength)]);
}

function encodeLengthMarker(typeNibble: number, length: number): Buffer {
  if (length < 0x0f) return Buffer.from([(typeNibble << 4) | length]);
  return Buffer.concat([Buffer.from([(typeNibble << 4) | 0x0f]), encodeIntObject(length)]);
}

function encodeStringObject(value: string): Buffer {
  if (isAscii(value)) {
    return Buffer.concat([encodeLengthMarker(0x5, value.length), Buffer.from(value, 'ascii')]);
  }
  const utf16 = Buffer.from(value, 'utf16le').swap16(); // bplist unicode strings are UTF-16BE
  return Buffer.concat([encodeLengthMarker(0x6, value.length), utf16]);
}

export function encodeFilenamesPboardBuffer(paths: string[]): Buffer {
  const numObjects = paths.length + 1; // object 0 = array, 1..N = strings
  const objRefSize = intByteLength(numObjects - 1);
  const refs = paths.map((_, i) => writeBigEndian(i + 1, objRefSize));
  const arrayObject = Buffer.concat([encodeLengthMarker(0xa, paths.length), ...refs]);
  const stringObjects = paths.map(encodeStringObject);
  const objects = [arrayObject, ...stringObjects];

  const offsets: number[] = [];
  let cursor = MAGIC.length;
  for (const object of objects) {
    offsets.push(cursor);
    cursor += object.length;
  }
  const offsetTableOffset = cursor;
  const offsetIntSize = intByteLength(offsetTableOffset);
  const offsetTable = Buffer.concat(offsets.map((offset) => writeBigEndian(offset, offsetIntSize)));

  const trailer = Buffer.alloc(32);
  trailer[6] = offsetIntSize;
  trailer[7] = objRefSize;
  writeBigEndian(numObjects, 8).copy(trailer, 8);
  writeBigEndian(0, 8).copy(trailer, 16); // top object = the array, index 0
  writeBigEndian(offsetTableOffset, 8).copy(trailer, 24);

  return Buffer.concat([Buffer.from(MAGIC, 'ascii'), ...objects, offsetTable, trailer]);
}

function readUInt(buf: Buffer, offset: number, byteLength: number): number {
  let value = 0;
  for (let i = 0; i < byteLength; i++) value = value * 256 + buf[offset + i];
  return value;
}

/** Reads the bplist integer object at `offset`; returns its value and how
 * many bytes it occupied, so the caller can continue parsing right after it. */
function readIntObject(buf: Buffer, offset: number): { value: number; size: number } {
  const marker = buf[offset];
  if (marker >> 4 !== 0x1) throw new Error('not an int object');
  const byteLength = 1 << (marker & 0x0f);
  return { value: readUInt(buf, offset + 1, byteLength), size: 1 + byteLength };
}

type BplistObject = string | { kind: 'array'; count: number; refsOffset: number };

function readObject(buf: Buffer, offset: number): BplistObject {
  const marker = buf[offset];
  const type = marker >> 4;
  const info = marker & 0x0f;

  if (type === 0x5 || type === 0x6) {
    let length = info;
    let dataOffset = offset + 1;
    if (info === 0x0f) {
      const lengthObject = readIntObject(buf, dataOffset);
      length = lengthObject.value;
      dataOffset += lengthObject.size;
    }
    if (type === 0x5) return buf.toString('ascii', dataOffset, dataOffset + length);
    // Unicode string objects are UTF-16BE; Node only decodes UTF-16LE, so the
    // byte pairs are swapped first (mirrors the swap done on encode).
    return Buffer.from(buf.subarray(dataOffset, dataOffset + length * 2))
      .swap16()
      .toString('utf16le');
  }

  if (type === 0xa) {
    let count = info;
    let refsOffset = offset + 1;
    if (info === 0x0f) {
      const countObject = readIntObject(buf, refsOffset);
      count = countObject.value;
      refsOffset += countObject.size;
    }
    return { kind: 'array', count, refsOffset };
  }

  throw new Error(`unsupported bplist object type 0x${type.toString(16)}`);
}

export function decodeFilenamesPboardBuffer(buf: Buffer): string[] {
  try {
    if (!buf || buf.length < 40 || buf.toString('ascii', 0, 8) !== MAGIC) return [];
    const trailer = buf.subarray(buf.length - 32);
    const offsetIntSize = trailer[6];
    const objRefSize = trailer[7];
    const numObjects = readUInt(trailer, 8, 8);
    const topObject = readUInt(trailer, 16, 8);
    const offsetTableOffset = readUInt(trailer, 24, 8);

    const offsetTable: number[] = [];
    for (let i = 0; i < numObjects; i++) {
      offsetTable.push(readUInt(buf, offsetTableOffset + i * offsetIntSize, offsetIntSize));
    }

    const root = readObject(buf, offsetTable[topObject]);
    if (typeof root === 'string' || root.kind !== 'array') return [];
    const paths: string[] = [];
    for (let i = 0; i < root.count; i++) {
      const ref = readUInt(buf, root.refsOffset + i * objRefSize, objRefSize);
      const value = readObject(buf, offsetTable[ref]);
      if (typeof value !== 'string') return [];
      paths.push(value);
    }
    return paths;
  } catch {
    return [];
  }
}

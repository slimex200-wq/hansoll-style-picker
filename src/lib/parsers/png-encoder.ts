import { deflateSync } from "zlib";

/**
 * Encode raw RGBA pixel data to PNG format.
 * Minimal encoder — no optimizations, just correct output.
 */
export function encodeRgbaToPng(
  rgba: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  // Build raw image data with filter byte (0 = None) per row
  const rowBytes = width * 4;
  const raw = new Uint8Array(height * (1 + rowBytes));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + rowBytes)] = 0; // filter: None
    raw.set(
      rgba.subarray(y * rowBytes, y * rowBytes + rowBytes),
      y * (1 + rowBytes) + 1
    );
  }

  const compressed = deflateSync(Buffer.from(raw));

  const chunks: Uint8Array[] = [];

  // PNG signature
  chunks.push(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = new Uint8Array(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk("IHDR", ihdr));

  // IDAT
  chunks.push(makeChunk("IDAT", compressed));

  // IEND
  chunks.push(makeChunk("IEND", new Uint8Array(0)));

  // Concatenate
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  writeU32(chunk, 0, data.length);
  // type
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  // CRC over type + data
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  writeU32(chunk, 8 + data.length, crc);
  return chunk;
}

function writeU32(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

// CRC-32 (PNG uses ISO 3309 / ITU-T V.42)
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

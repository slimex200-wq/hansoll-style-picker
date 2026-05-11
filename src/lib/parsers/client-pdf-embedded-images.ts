/**
 * Client-side PDF embedded image extraction.
 *
 * Walks each page's operator list, finds paint-image operators, resolves the
 * referenced image XObject, renders it to a canvas at native resolution, and
 * returns the JPEG blob along with the page number it appeared on.
 *
 * The SUM'27 PDFs put one style per page with a small number of embedded
 * raster images (the actual product photos). Pairing by page number (which
 * parsePdfClient already records on each style as `pageNum`) gives clean
 * per-style image lists without any layout heuristics.
 */

import type { ParseResult } from "./types";

const WORKER_URL =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs";

// pdfjs ImageKind enum
const KIND_GRAYSCALE_1BPP = 1;
const KIND_RGB_24BPP = 2;
const KIND_RGBA_32BPP = 3;

// Skip tiny "images" — almost always vector decorations / icons / 1px stamps,
// not actual product photos. The cutoff is generous; SUM'27 product photos are
// typically 300+px on the short side.
const MIN_IMAGE_DIM = 100;

const JPEG_QUALITY = 0.85;

export interface PageEmbeddedImage {
  pageNum: number;
  imageIndex: number;
  blob: Blob;
  width: number;
  height: number;
}

export interface ExtractProgress {
  pageNum: number;
  totalPages: number;
  imagesSoFar: number;
}

interface PdfImage {
  width?: number;
  height?: number;
  bitmap?: ImageBitmap;
  data?: Uint8Array | Uint8ClampedArray;
  kind?: number;
}

interface PdfPageObjs {
  get(name: string, callback: (obj: PdfImage | null) => void): void;
}

interface PdfPage {
  getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  objs: PdfPageObjs;
}

export async function extractPdfEmbeddedImages(
  file: File,
  onProgress?: (p: ExtractProgress) => void
): Promise<PageEmbeddedImage[]> {
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
  const OPS = (pdfjsLib as unknown as { OPS: Record<string, number> }).OPS;

  const paintOps = new Set([
    OPS.paintImageXObject,
    OPS.paintImageXObjectRepeat,
    OPS.paintJpegXObject,
  ]);

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = doc.numPages;

  const results: PageEmbeddedImage[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = (await doc.getPage(pageNum)) as unknown as PdfPage;
    const ops = await page.getOperatorList();

    const seen = new Set<string>();
    let imageIndex = 0;

    for (let opIdx = 0; opIdx < ops.fnArray.length; opIdx++) {
      const fn = ops.fnArray[opIdx];
      if (!paintOps.has(fn)) continue;

      const args = ops.argsArray[opIdx];
      const name = typeof args?.[0] === "string" ? (args[0] as string) : null;
      if (!name || seen.has(name)) continue;
      seen.add(name);

      try {
        const img = await resolveImage(page, name);
        if (!img) continue;
        if (
          (img.width ?? 0) < MIN_IMAGE_DIM ||
          (img.height ?? 0) < MIN_IMAGE_DIM
        ) {
          continue;
        }
        const blob = await imageToJpegBlob(img);
        if (!blob) continue;
        results.push({
          pageNum,
          imageIndex: imageIndex++,
          blob,
          width: img.width ?? 0,
          height: img.height ?? 0,
        });
      } catch {
        // Best-effort: a single bad image shouldn't kill the whole PDF.
      }
    }

    onProgress?.({ pageNum, totalPages, imagesSoFar: results.length });
  }

  return results;
}

function resolveImage(page: PdfPage, name: string): Promise<PdfImage | null> {
  return new Promise((resolve) => {
    page.objs.get(name, (img) => resolve(img ?? null));
  });
}

async function imageToJpegBlob(img: PdfImage): Promise<Blob | null> {
  const { width, height } = img;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
  } else if (img.data) {
    const pixels = expandToRgba(img);
    if (!pixels) return null;
    // Cast to ArrayBuffer-backed since pdfjs may give us a SharedArrayBuffer
    // view that ImageData's lib types reject.
    const imageData = new ImageData(
      pixels as Uint8ClampedArray<ArrayBuffer>,
      width,
      height
    );
    ctx.putImageData(imageData, 0, 0);
  } else {
    return null;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

function expandToRgba(img: PdfImage): Uint8ClampedArray | null {
  const { width, height, data, kind } = img;
  if (!width || !height || !data) return null;
  const pixels = width * height;

  if (kind === KIND_RGBA_32BPP) {
    // Copy rather than view: data.buffer can be SharedArrayBuffer, which
    // ImageData rejects.
    const rgba = new Uint8ClampedArray(pixels * 4);
    rgba.set(data.subarray(0, pixels * 4));
    return rgba;
  }
  if (kind === KIND_RGB_24BPP) {
    const rgba = new Uint8ClampedArray(pixels * 4);
    for (let i = 0, j = 0; i < pixels; i++, j += 3) {
      rgba[i * 4] = data[j];
      rgba[i * 4 + 1] = data[j + 1];
      rgba[i * 4 + 2] = data[j + 2];
      rgba[i * 4 + 3] = 255;
    }
    return rgba;
  }
  if (kind === KIND_GRAYSCALE_1BPP) {
    const rgba = new Uint8ClampedArray(pixels * 4);
    for (let i = 0; i < pixels; i++) {
      const byte = data[i >> 3];
      const bit = (byte >> (7 - (i & 7))) & 1;
      const v = bit ? 255 : 0;
      rgba[i * 4] = v;
      rgba[i * 4 + 1] = v;
      rgba[i * 4 + 2] = v;
      rgba[i * 4 + 3] = 255;
    }
    return rgba;
  }
  return null;
}

/**
 * Group already-extracted images by their page number — handy for matching to
 * styles that carry a `pageNum`.
 */
export function groupImagesByPage(
  images: PageEmbeddedImage[]
): Map<number, PageEmbeddedImage[]> {
  const map = new Map<number, PageEmbeddedImage[]>();
  for (const img of images) {
    const list = map.get(img.pageNum) ?? [];
    list.push(img);
    map.set(img.pageNum, list);
  }
  return map;
}

// Re-export for convenience so callers can use a single import path.
export type { ParseResult };

/**
 * Client-side PDF 페이지 이미지 추출
 * Browser canvas rendering 사용 — server-side보다 안정적
 */

export interface PageImage {
  pageNum: number;
  blob: Blob;
  width: number;
  height: number;
}

const WORKER_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.5.207/pdf.worker.min.mjs";

const RENDER_SCALE = 2;
const JPEG_QUALITY = 0.85;

export async function extractPdfPageImages(file: File): Promise<PageImage[]> {
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const images: PageImage[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    // DOM canvas 사용 (OffscreenCanvas는 DOMMatrix 미지원 문제)
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({ canvas, canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    });

    images.push({
      pageNum: i,
      blob,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return images;
}

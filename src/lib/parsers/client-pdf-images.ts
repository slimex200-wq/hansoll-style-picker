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

    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    // pdfjs v5: canvas=null forces canvasContext 사용
    await page.render({
      canvas: null,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: JPEG_QUALITY,
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

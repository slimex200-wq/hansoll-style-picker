/**
 * Client-side PDF text extraction → markdown parsing.
 *
 * The server-side /api/parse-pdf route hits Vercel's 4.5MB request body limit
 * for larger PDFs (e.g. the 5.5MB SUM'27 TALBOTS premeeting recap), returning
 * 413 before the route even runs. Parsing in the browser bypasses that limit
 * entirely — we only POST the (KB-sized) parsed JSON to /api/import-styles.
 *
 * Mirrors src/lib/parsers/pdf-parser.ts (server) but uses the browser pdfjs
 * build + a CDN worker, matching the existing client-pdf-images.ts pattern.
 */

import type { ParseResult } from "./types";
import { parseMarkdownStyles } from "./markdown-parser";
import { reconstructTables } from "./pdf-parser";

const WORKER_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.5.207/pdf.worker.min.mjs";

interface ParseOptions {
  defaultCollection?: string;
  defaultDivision?: string;
}

export async function parsePdfClient(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => (item as { str?: unknown }).str)
      .filter((str): str is string => typeof str === "string")
      .join(" ");
    pageTexts.push(text);
  }

  const fullText = pageTexts
    .map((text, i) => `\n--- Page ${i + 1} ---\n${text}`)
    .join("\n");
  const tableText = reconstructTables(fullText);

  const result = parseMarkdownStyles(tableText, options);
  result.metadata.totalPages = doc.numPages;
  result.metadata.source = "pdf";

  for (const style of result.styles) {
    const pageIndex = pageTexts.findIndex((text) => text.includes(style.style_id));
    if (pageIndex !== -1) {
      style.pageNum = pageIndex + 1;
    }
  }

  return result;
}

import type { ParseResult } from "./types";
import { parseMarkdownStyles } from "./markdown-parser";

// Vercel serverless에서 DOMMatrix가 없으면 polyfill
if (typeof globalThis.DOMMatrix === "undefined") {
  // pdfjs text extraction은 DOMMatrix를 실제로 사용하지 않지만 import 시 참조함
  // 최소 stub으로 충분
  (globalThis as Record<string, unknown>).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(init?: number[]) {
      if (init && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      }
    }
    isIdentity = true;
    inverse() { return new DOMMatrix(); }
    multiply() { return new DOMMatrix(); }
    translate() { return new DOMMatrix(); }
    scale() { return new DOMMatrix(); }
    transformPoint(p: { x: number; y: number }) { return p; }
  };
}

interface PdfPage {
  getTextContent: () => Promise<{
    items: Array<{ str?: string }>;
  }>;
}

interface PdfDocument {
  numPages: number;
  getPage: (num: number) => Promise<PdfPage>;
}

export async function parsePdfBuffer(
  buffer: ArrayBuffer,
  options?: { defaultCollection?: string; defaultDivision?: string }
): Promise<ParseResult> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const doc = (await pdfjsLib.getDocument({ data: buffer, isEvalSupported: false, useWorkerFetch: false, useSystemFonts: false }).promise) as unknown as PdfDocument;

  // 1) Extract text from all pages
  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item): item is { str: string } => typeof item.str === "string")
      .map((item) => item.str)
      .join(" ");
    pageTexts.push(text);
  }

  // Build pseudo-markdown from extracted text
  const fullText = pageTexts
    .map((text, i) => `\n--- Page ${i + 1} ---\n${text}`)
    .join("\n");

  const tableText = reconstructTables(fullText);

  // 2) Parse with markdown parser
  const result = parseMarkdownStyles(tableText, options);
  result.metadata.totalPages = doc.numPages;
  result.metadata.source = "pdf";

  // 3) style별 page number 매핑 (client-side 이미지 매칭용)
  for (const style of result.styles) {
    const pageIndex = pageTexts.findIndex((text) =>
      text.includes(style.style_id)
    );
    if (pageIndex !== -1) {
      style.pageNum = pageIndex + 1;
    }
  }

  return result;
}

function reconstructTables(text: string): string {
  let output = text;

  const fields = [
    "STYLE #",
    "FABRIC #",
    "CONTENTS",
    "CONSTRUCTION",
    "WEIGHT",
    "FINISHING",
    "DESIGNED BY",
  ];

  for (const field of fields) {
    const pattern = new RegExp(
      `${field.replace("#", "\s*#")}\s+([^\n]+?)(?=\s+(?:${fields
        .map((f) => f.replace("#", "\s*#"))
        .join("|")})|$)`,
      "g"
    );
    output = output.replace(pattern, `|${field}|$1|`);
  }

  return output;
}

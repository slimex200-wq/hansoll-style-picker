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

  // Vercel serverless: worker 파일 경로를 file:// URL로 지정
  if (!("pdfjsWorker" in globalThis)) {
    (globalThis as Record<string, unknown>).pdfjsWorker = await import(
      "pdfjs-dist/legacy/build/pdf.worker.mjs"
    );
  }

  const doc = (await pdfjsLib.getDocument({ data: buffer }).promise) as unknown as PdfDocument;

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

export function reconstructTables(text: string): string {
  const fields = [
    "STYLE #",
    "FABRIC #",
    "CONTENTS",
    "CONSTRUCTION",
    "WEIGHT",
    "FINISHING",
    "DESIGNED BY",
  ];
  const stopFields = ["COMMENTS", "COMMENT", "FABRIC SUGGESTION"];

  const labelPattern = (field: string) =>
    field.split(/\s+/).map(escapeRegExp).join("\\s+").replace("\\#", "\\s*#");
  const styleStartRe = new RegExp(labelPattern("STYLE #"), "gi");
  const starts = [...text.matchAll(styleStartRe)].map((match) => match.index ?? 0);

  if (starts.length === 0) {
    return text;
  }

  const blocks: string[] = [];

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = starts[i + 1] ?? text.length;
    const segment = text.slice(start, end).replace(/\s+/g, " ").trim();
    const labels = fields
      .map((field) => {
        const match = new RegExp(labelPattern(field), "i").exec(segment);
        return match
          ? { field, start: match.index, end: match.index + match[0].length }
          : null;
      })
      .filter((label): label is { field: string; start: number; end: number } => Boolean(label));
    const stopLabels = stopFields
      .map((field) => {
        const match = new RegExp(labelPattern(field), "i").exec(segment);
        return match
          ? { field, start: match.index, end: match.index + match[0].length }
          : null;
      })
      .filter((label): label is { field: string; start: number; end: number } => Boolean(label));
    const allLabels = [...labels, ...stopLabels];

    const rows = fields.map((field) => {
      const label = labels.find((item) => item.field === field);
      const nextLabel = label
        ? allLabels
            .filter((item) => item.start > label.start)
            .sort((a, b) => a.start - b.start)[0]
        : null;
      const value = label
        ? segment.slice(label.end, nextLabel?.start ?? segment.length).trim()
        : "";
      return `|${field}|${value}|`;
    });

    const styleId = rows[0].match(/\|STYLE #\|([^|]*)\|/)?.[1]?.trim();
    if (styleId) {
      const lastFieldLabel = labels.find((label) => label.field === "DESIGNED BY");
      const trailingStart = lastFieldLabel
        ? (allLabels
            .filter((item) => item.start > lastFieldLabel.start)
            .sort((a, b) => a.start - b.start)[0]?.start ?? segment.length)
        : segment.length;
      const trailingText = segment.slice(trailingStart).trim();
      blocks.push([rows.join("\n"), trailingText].filter(Boolean).join("\n"));
    }
  }

  return `${text}\n\n${blocks.join("\n\n")}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

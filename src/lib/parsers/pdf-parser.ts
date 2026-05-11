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

  const findLabels = (haystack: string, needles: string[]): LabelMatch[] =>
    needles
      .map((field) => {
        const match = new RegExp(labelPattern(field), "i").exec(haystack);
        return match
          ? { field, start: match.index, end: match.index + match[0].length }
          : null;
      })
      .filter((label): label is LabelMatch => Boolean(label));

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = starts[i + 1] ?? text.length;

    // Horizontal layout (e.g., SU'27 PDFs) places all 7 column headers in a row,
    // then the value row, then "COMMENTS:". 2-space gaps separate columns; the
    // collapsed-whitespace segment below loses those boundaries, so try the
    // horizontal parser on the raw slice first.
    const rawSegment = text.slice(start, end).trim();
    const rawLabels = findLabels(rawSegment, fields);
    const rawStopLabels = findLabels(rawSegment, stopFields);
    const horizontalRows = parseHorizontalRow(rawSegment, rawLabels, rawStopLabels, fields);
    if (horizontalRows) {
      blocks.push(horizontalRows.join("\n"));
      continue;
    }

    const segment = text.slice(start, end).replace(/\s+/g, " ").trim();
    const labels = findLabels(segment, fields);
    const stopLabels = findLabels(segment, stopFields);
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

interface LabelMatch {
  field: string;
  start: number;
  end: number;
}

function parseHorizontalRow(
  segment: string,
  labels: LabelMatch[],
  stopLabels: LabelMatch[],
  fields: string[]
): string[] | null {
  if (labels.length !== fields.length) return null;
  const sorted = [...labels].sort((a, b) => a.start - b.start);
  // Labels must appear in the expected order with only whitespace between them.
  for (let i = 0; i < fields.length; i++) {
    if (sorted[i].field !== fields[i]) return null;
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    if (segment.slice(sorted[i].end, sorted[i + 1].start).trim().length > 0) {
      return null;
    }
  }

  const lastLabel = sorted[sorted.length - 1];
  const firstStop = [...stopLabels]
    .filter((s) => s.start > lastLabel.end)
    .sort((a, b) => a.start - b.start)[0];
  const valuesText = segment
    .slice(lastLabel.end, firstStop?.start ?? segment.length)
    .trim();

  const values = valuesText
    .split(/\s{2,}/)
    .map((value) => value.trim())
    .filter(Boolean);

  let mapped: string[];
  if (values.length === fields.length) {
    mapped = values;
  } else if (values.length === fields.length - 1) {
    // FINISHING (index 5) is the typical missing field on the SU'27 layout.
    mapped = [...values.slice(0, 5), "", ...values.slice(5)];
  } else {
    return null;
  }

  if (!mapped[0]) return null;
  return fields.map((field, i) => `|${field}|${mapped[i]}|`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

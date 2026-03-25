import type { ParseResult, ParsedImage } from "./types";
import { parseMarkdownStyles } from "./markdown-parser";

interface PdfPage {
  getTextContent: () => Promise<{
    items: Array<{ str?: string }>;
  }>;
  getOperatorList: () => Promise<{
    fnArray: number[];
    argsArray: unknown[][];
  }>;
  commonObjs: {
    get: (name: string) => {
      data: Uint8Array;
      width: number;
      height: number;
    } | null;
  };
}

interface PdfDocument {
  numPages: number;
  getPage: (num: number) => Promise<PdfPage>;
}

export async function parsePdfBuffer(
  buffer: ArrayBuffer,
  options?: { defaultCollection?: string; defaultDivision?: string }
): Promise<ParseResult> {
  // Dynamic import for pdfjs-dist (server-side)
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

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

  // Build a pseudo-markdown from extracted text
  // Style tables in the text appear as space-separated fields
  // We need to reconstruct the table format for the markdown parser
  const fullText = pageTexts
    .map((text, i) => `\n--- Page ${i + 1} ---\n${text}`)
    .join("\n");

  // Convert extracted text to table-like format
  const tableText = reconstructTables(fullText);

  // 2) Parse with markdown parser
  const result = parseMarkdownStyles(tableText, options);
  result.metadata.totalPages = doc.numPages;
  result.metadata.source = "pdf";

  // 3) Extract images (best-effort)
  try {
    const images = await extractImagesFromPdf(doc);
    // Map images to styles by page proximity
    mapImagesToStyles(result, images, pageTexts);
  } catch {
    result.warnings.push("Image extraction failed - use ZIP upload for images");
  }

  return result;
}

function reconstructTables(text: string): string {
  // The PDF text extraction gives us runs of text.
  // Style tables appear as: "STYLE # HDW127051 --- FABRIC # FL25102386 ..."
  // We need to convert these to markdown table format.

  let output = text;

  // Convert "STYLE # VALUE" patterns to "|STYLE #|VALUE|" format
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
    // Match field followed by value (up to next field or newline)
    const pattern = new RegExp(
      `${field.replace("#", "\\s*#")}\\s+([^\\n]+?)(?=\\s+(?:${fields
        .map((f) => f.replace("#", "\\s*#"))
        .join("|")})|$)`,
      "g"
    );
    output = output.replace(pattern, `|${field}|$1|`);
  }

  return output;
}

async function extractImagesFromPdf(
  doc: PdfDocument
): Promise<Array<ParsedImage & { pageNum: number }>> {
  const images: Array<ParsedImage & { pageNum: number }> = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    try {
      const ops = await page.getOperatorList();

      for (let j = 0; j < ops.fnArray.length; j++) {
        // OPS.paintImageXObject = 85
        if (ops.fnArray[j] === 85) {
          const imgName = ops.argsArray[j][0] as string;
          try {
            const imgData = page.commonObjs.get(imgName);
            if (imgData && imgData.data && imgData.width > 50 && imgData.height > 50) {
              images.push({
                data: imgData.data,
                mimeType: "image/png",
                filename: `page-${i}-${j}.png`,
                pageIndex: i - 1,
                pageNum: i,
              });
            }
          } catch {
            // Skip individual image extraction failures
          }
        }
      }
    } catch {
      // Skip page-level failures
    }
  }

  return images;
}

function mapImagesToStyles(
  result: ParseResult,
  images: Array<ParsedImage & { pageNum: number }>,
  pageTexts: string[]
): void {
  // Heuristic: find which page each style appears on
  for (const style of result.styles) {
    const pageIndex = pageTexts.findIndex((text) =>
      text.includes(style.style_id)
    );
    if (pageIndex === -1) continue;

    const pageNum = pageIndex + 1;
    // Find images on this page or adjacent pages
    const styleImages = images.filter(
      (img) => img.pageNum >= pageNum && img.pageNum <= pageNum + 1
    );

    // Take at most 2 images per style
    style.images = styleImages.slice(0, 2).map((img) => ({
      data: img.data,
      mimeType: img.mimeType,
      filename: `${style.style_id}-${img.pageNum}.png`,
      pageIndex: img.pageIndex,
    }));
  }
}

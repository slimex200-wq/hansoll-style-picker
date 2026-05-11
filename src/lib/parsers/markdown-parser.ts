import type { ParsedStyle, ParsedFabricSuggestion, ParseResult } from "./types";

interface ParseOptions {
  defaultCollection?: string;
  defaultDivision?: string;
}

// Matches a style table block: |STYLE #|XXX| ... |DESIGNED BY|XXX|
const STYLE_BLOCK_RE =
  /\|STYLE #\|([^|\n]+)\|[\s\S]*?\|DESIGNED BY\|([^|\n]+)\|/g;

// Individual field extraction within a style block
const FIELD_RE = {
  style_id: /\|STYLE #\|([^|\n]+)\|/,
  fabric_no: /\|FABRIC #\|([^|\n]*)\|/,
  contents: /\|CONTENTS\|([^|\n]+)\|/,
  construction: /\|CONSTRUCTION\|([^|\n]+)\|/,
  weight: /\|WEIGHT\|([^|\n]+)\|/,
  finishing: /\|FINISHING\|([^|\n]*)\|/,
  designed_by: /\|DESIGNED BY\|([^|\n]+)\|/,
};

// Collection patterns. More specific patterns must come first because the
// last-position match wins (so a pattern matching the cover page should also
// be the most specific).
//
// Both SUM'27 PDFs land in a single SU27-TALBOTS collection so the sidebar can
// show one season with division-level breakdown (T BY TALBOTS vs Knit Top),
// instead of switching between two collections per upload.
const COLLECTION_PATTERNS: Array<{ pattern: RegExp; collection: string }> = [
  { pattern: /SUM['\s]*27[\s_]+T[\s_]+BY[\s_]+TALBOTS/i, collection: "SU27-TALBOTS" },
  { pattern: /SUM['\s]*27[\s_]+TALBOTS/i, collection: "SU27-TALBOTS" },
  // SP'27
  { pattern: /For\s+T\s+by\s+Talbots/i, collection: "T-BY-TALBOTS" },
  { pattern: /T\s+by\s+Talbots/i, collection: "T-BY-TALBOTS" },
  { pattern: /SP.*27.*TXT.*TALBOTS\s+OUTLET/i, collection: "SP27-TALBOTS-OUTLET" },
  { pattern: /TALBOTS\s+OUTLET/i, collection: "SP27-TALBOTS-OUTLET" },
];

// Division patterns — search the same context (text-before-style-block) for
// markers that put the style under a non-default division.
const DIVISION_PATTERNS: Array<{ pattern: RegExp; division: string }> = [
  // SUM'27 T BY TALBOTS PDF cover reads "SUM'27 T_BY_TALBOTS PREMEETING RECAP"
  // (pdfjs joins with underscores). Tag those styles as T BY TALBOTS division.
  { pattern: /SUM['\s]*27[\s_]+T[\s_]+BY[\s_]+TALBOTS/i, division: "T BY TALBOTS" },
  // SP'27 TXT section marker (legacy)
  { pattern: /SP['\s]*27\s+TXT/i, division: "TXT" },
];

function extractField(block: string, field: keyof typeof FIELD_RE): string {
  const match = block.match(FIELD_RE[field]);
  return match ? match[1].trim() : "";
}

function normalizeWeight(weight: string): string {
  return weight
    .replace(/\u00B2/g, "2")
    .replace(/G\/M.$/i, "G/M2")
    .trim();
}

function parseFabricSuggestion(
  text: string
): ParsedFabricSuggestion | null {
  const fabricMatch = text.match(/FL\d{6,}/);
  if (!fabricMatch || fabricMatch.index === undefined) return null;

  const afterFabric = text
    .slice(fabricMatch.index + fabricMatch[0].length)
    .trim();
  const weightMatch = afterFabric.match(/([\d.]+\s*G\/M.?)\s*$/i);
  if (!weightMatch || weightMatch.index === undefined) return null;

  const beforeWeight = afterFabric.slice(0, weightMatch.index).trim();
  const compositionMatch = beforeWeight.match(
    /\b\d+(?:\/\d+)*(?:\.\d+)?\s+[A-Za-z][A-Za-z/ ]*$/
  );
  if (!compositionMatch || compositionMatch.index === undefined) return null;

  return {
    fabric_no: fabricMatch[0].trim(),
    construction: beforeWeight.slice(0, compositionMatch.index).trim(),
    contents: compositionMatch[0].trim(),
    weight: normalizeWeight(weightMatch[1]),
  };
}

function detectDivision(textBefore: string, defaultDivision: string): string {
  // Walk DIVISION_PATTERNS the same way detectCollection does — last match wins.
  let lastIndex = -1;
  let lastDivision = defaultDivision;
  for (const { pattern, division } of DIVISION_PATTERNS) {
    const match = textBefore.match(pattern);
    if (match && match.index !== undefined && match.index > lastIndex) {
      lastIndex = match.index;
      lastDivision = division;
    }
  }
  return lastDivision;
}

function detectCollection(
  textBefore: string,
  defaultCollection: string
): string {
  // Search backwards for the most recent collection marker
  let lastIndex = -1;
  let lastCollection = defaultCollection;

  for (const { pattern, collection } of COLLECTION_PATTERNS) {
    const match = textBefore.match(pattern);
    if (match && match.index !== undefined && match.index > lastIndex) {
      lastIndex = match.index;
      lastCollection = collection;
    }
  }

  return lastCollection;
}

export function parseMarkdownStyles(
  markdown: string,
  options: ParseOptions = {}
): ParseResult {
  // Use ?? so an explicit `null` from formData.get(...) also falls back to the
  // sensible default (destructure defaults only fire on `undefined`).
  const defaultCollection = options.defaultCollection ?? "SP27-TALBOTS-OUTLET";
  const defaultDivision = options.defaultDivision ?? "Knit Top";

  const styles: ParsedStyle[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  // Find all style blocks
  let match: RegExpExecArray | null;
  STYLE_BLOCK_RE.lastIndex = 0;

  while ((match = STYLE_BLOCK_RE.exec(markdown)) !== null) {
    const block = match[0];
    const blockStart = match.index;
    const textBefore = markdown.substring(0, blockStart);

    try {
      const styleId = extractField(block, "style_id");
      if (!styleId) {
        errors.push(`Empty style ID at position ${blockStart}`);
        continue;
      }

      if (seenIds.has(styleId)) {
        warnings.push(`Duplicate style ID: ${styleId}`);
        continue;
      }
      seenIds.add(styleId);

      // Detect collection and division from context
      const collection = detectCollection(textBefore, defaultCollection);
      const division = detectDivision(textBefore, defaultDivision);

      // Look for fabric suggestion after this block (within next 500 chars)
      const afterBlock = markdown.substring(
        blockStart + block.length,
        blockStart + block.length + 500
      );
      const fabricSuggestion = parseFabricSuggestion(afterBlock);

      const style: ParsedStyle = {
        style_id: styleId,
        fabric_no: extractField(block, "fabric_no"),
        contents: extractField(block, "contents"),
        construction: extractField(block, "construction"),
        weight: normalizeWeight(extractField(block, "weight")),
        finishing: extractField(block, "finishing"),
        designed_by: extractField(block, "designed_by"),
        division,
        collection,
        fabric_suggestion: fabricSuggestion,
        images: [],
      };

      styles.push(style);
    } catch (e) {
      errors.push(
        `Failed to parse style at position ${blockStart}: ${(e as Error).message}`
      );
    }
  }

  // Collect unique collections and divisions
  const collections = [...new Set(styles.map((s) => s.collection))];
  const divisions = [...new Set(styles.map((s) => s.division))];

  if (styles.length === 0) {
    errors.push("No style tables found in document");
  }

  return {
    styles,
    errors,
    warnings,
    metadata: {
      totalPages: 0,
      source: "markdown",
      collections,
      divisions,
    },
  };
}

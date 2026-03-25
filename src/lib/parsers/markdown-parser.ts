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

// Fabric suggestion line: FL25102427POINTELLE 95/5 COTTON/SPANDEX 220 G/M²
// Pattern: fabricNo + optional construction + contents + weight
const FABRIC_SUGGESTION_RE =
  /^(FL\d{6,})\s*([A-Z][A-Z /&*]+?)?\s+([\d/]+\s+[\w/]+(?:\s*[\w/]+)*)\s+([\d.]+\s*G\/M.?)$/m;

// Alternate: sometimes construction is concatenated with fabricNo
const FABRIC_SUGGESTION_ALT_RE =
  /(FL\d{6,})([A-Z][A-Z ]+)\s+([\d/]+\s+[\w/]+(?:\s*[\w/]+)*)\s+([\d.]+\s*G\/M.?)$/m;

// Division/section header patterns
const DIVISION_PATTERNS = [
  /SP'27\s+TXT/i,
  /\bTXT\b.*TALBOTS/i,
  /\bKnit\s*Top\b/i,
  /\bWoven\b/i,
  /\bSweater\b/i,
];

// Collection patterns
const COLLECTION_PATTERNS: Array<{ pattern: RegExp; collection: string }> = [
  { pattern: /For\s+T\s+by\s+Talbots/i, collection: "T-BY-TALBOTS" },
  { pattern: /T\s+by\s+Talbots/i, collection: "T-BY-TALBOTS" },
  { pattern: /SP.*27.*TXT.*TALBOTS\s+OUTLET/i, collection: "SP27-TALBOTS-OUTLET" },
  { pattern: /TALBOTS\s+OUTLET/i, collection: "SP27-TALBOTS-OUTLET" },
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
  // Try alternate pattern first (fabricNo+construction concatenated)
  let match = text.match(FABRIC_SUGGESTION_ALT_RE);
  if (match) {
    return {
      fabric_no: match[1].trim(),
      construction: match[2].trim(),
      contents: match[3].trim(),
      weight: normalizeWeight(match[4]),
    };
  }

  // Try standard pattern
  match = text.match(FABRIC_SUGGESTION_RE);
  if (match) {
    return {
      fabric_no: match[1].trim(),
      construction: match[2]?.trim() ?? "",
      contents: match[3].trim(),
      weight: normalizeWeight(match[4]),
    };
  }

  return null;
}

function detectDivision(textBefore: string, defaultDivision: string): string {
  // Check from end to start for the most recent division marker
  const txtMatch = textBefore.match(/SP'27\s+TXT/i);
  if (txtMatch) return "TXT";

  // Default to the provided division
  return defaultDivision;
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
  const {
    defaultCollection = "SP27-TALBOTS-OUTLET",
    defaultDivision = "Knit Top",
  } = options;

  const styles: ParsedStyle[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  // Split into lines for context analysis
  const lines = markdown.split("\n");

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

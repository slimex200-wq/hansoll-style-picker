import JSZip from "jszip";
import type { FabricDetail } from "@/lib/fabric-details";

export interface FabricMappingParseResult {
  rows: FabricDetail[];
  warnings: string[];
  sheetName: string;
}

const TARGET_SHEET_NAME = "Style-Fabric Mapping";

const FIELD_MAP: Array<{ header: string; key: keyof FabricDetail }> = [
  { header: "Source Sheet", key: "sourceSheet" },
  { header: "Pattern #", key: "pattern" },
  { header: "Style #", key: "styleId" },
  { header: "Option", key: "option" },
  { header: "FL # / Code", key: "fabricCode" },
  { header: "Supplier", key: "supplier" },
  { header: "Construction", key: "construction" },
  { header: "Content", key: "content" },
  { header: "Width (inch)", key: "widthInch" },
  { header: "Weight (g/m2)", key: "weightGm2" },
  { header: "$/YD", key: "priceYd" },
  { header: "$/LB", key: "priceLb" },
  { header: "Finish", key: "finish" },
  { header: "Yarn Detail", key: "yarnDetail" },
  { header: "Comment", key: "comment" },
  { header: "Fabric CO", key: "fabricCountry" },
  { header: "Original FL Text", key: "originalText" },
];

const REQUIRED_HEADERS = ["Style #", "FL # / Code"];
const NUMERIC_FIELDS = new Set<keyof FabricDetail>([
  "widthInch",
  "weightGm2",
  "priceYd",
  "priceLb",
]);

interface WorkbookSheet {
  name: string;
  relationshipId: string;
}

export async function parseFabricMappingWorkbook(
  buffer: ArrayBuffer
): Promise<FabricMappingParseResult> {
  const zip = await JSZip.loadAsync(buffer);
  const sharedStrings = await readSharedStrings(zip);
  const sheets = await readWorkbookSheets(zip);

  if (sheets.length === 0) {
    throw new Error("No worksheets found in workbook");
  }

  const warnings: string[] = [];
  const targetSheet =
    sheets.find((sheet) => normalize(sheet.name) === normalize(TARGET_SHEET_NAME)) ??
    sheets[sheets.length - 1];

  if (normalize(targetSheet.name) !== normalize(TARGET_SHEET_NAME)) {
    warnings.push(
      `"${TARGET_SHEET_NAME}" sheet not found; used last sheet "${targetSheet.name}"`
    );
  }

  const sheetPath = await resolveSheetPath(zip, targetSheet.relationshipId);
  const sheetXml = await readZipText(zip, sheetPath);
  const table = parseSheetRows(sheetXml, sharedStrings);
  const headerRow = table.find((row) => row.some(Boolean));

  if (!headerRow) {
    throw new Error(`No header row found in "${targetSheet.name}"`);
  }

  const headerIndex = new Map(
    headerRow.map((header, index) => [normalizeHeader(header), index])
  );
  const missingRequired = REQUIRED_HEADERS.filter(
    (header) => !headerIndex.has(normalizeHeader(header))
  );
  if (missingRequired.length > 0) {
    throw new Error(`Missing required column(s): ${missingRequired.join(", ")}`);
  }

  const missingOptional = FIELD_MAP
    .map((field) => field.header)
    .filter((header) => !headerIndex.has(normalizeHeader(header)));
  if (missingOptional.length > 0) {
    warnings.push(`Missing optional column(s): ${missingOptional.join(", ")}`);
  }

  const headerRowIndex = table.indexOf(headerRow);
  const rows = table
    .slice(headerRowIndex + 1)
    .map((row) => rowToFabricDetail(row, sharedStrings))
    .filter((detail) => detail.styleId || detail.fabricCode);

  if (rows.length === 0) {
    throw new Error(`No fabric mapping rows found in "${targetSheet.name}"`);
  }

  return {
    rows,
    warnings,
    sheetName: targetSheet.name,
  };
}

function rowToFabricDetail(
  row: string[],
  sharedStrings: string[]
): FabricDetail {
  const detail = emptyFabricDetail();
  for (const [index, field] of FIELD_MAP.entries()) {
    const rawValue = row[index] ?? "";
    const value = NUMERIC_FIELDS.has(field.key)
      ? rawValue
      : decodeSharedStringIndex(rawValue, sharedStrings);
    detail[field.key] = cleanCell(value);
  }
  detail.styleId = detail.styleId.toUpperCase();
  return detail;
}

function emptyFabricDetail(): FabricDetail {
  return {
    sourceSheet: "",
    pattern: "",
    styleId: "",
    option: "",
    fabricCode: "",
    supplier: "",
    construction: "",
    content: "",
    widthInch: "",
    weightGm2: "",
    priceYd: "",
    priceLb: "",
    finish: "",
    yarnDetail: "",
    comment: "",
    fabricCountry: "",
    originalText: "",
  };
}

async function readWorkbookSheets(zip: JSZip): Promise<WorkbookSheet[]> {
  const workbookXml = await readZipText(zip, "xl/workbook.xml");
  const sheetMatches = [...workbookXml.matchAll(/<sheet\b[^>]*>/g)];
  return sheetMatches.map((match) => {
    const tag = match[0];
    return {
      name: decodeXml(getAttribute(tag, "name")),
      relationshipId: getAttribute(tag, "r:id"),
    };
  });
}

async function resolveSheetPath(zip: JSZip, relationshipId: string): Promise<string> {
  const relsXml = await readZipText(zip, "xl/_rels/workbook.xml.rels");
  const relationship = [...relsXml.matchAll(/<Relationship\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => getAttribute(tag, "Id") === relationshipId);

  if (!relationship) {
    throw new Error(`Worksheet relationship not found: ${relationshipId}`);
  }

  const target = getAttribute(relationship, "Target").replace(/^\/+/, "");
  return target.startsWith("xl/") ? target : `xl/${target}`;
}

async function readSharedStrings(zip: JSZip): Promise<string[]> {
  const file = zip.file("xl/sharedStrings.xml");
  if (!file) return [];

  const xml = await file.async("string");
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((part) => decodeXml(part[1]))
      .join("")
  );
}

function parseSheetRows(sheetXml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowMatches = [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];

  for (const rowMatch of rowMatches) {
    const row: string[] = [];
    const cellMatches = [...rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)];
    for (const cellMatch of cellMatches) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = getAttribute(`<c ${attrs}>`, "r");
      const colIndex = ref ? columnNameToIndex(ref.replace(/\d+/g, "")) : row.length;
      row[colIndex] = readCellValue(attrs, body, sharedStrings);
    }
    rows.push(row.map((cell) => cell ?? ""));
  }

  return rows;
}

function readCellValue(
  attrs: string,
  body: string,
  sharedStrings: string[]
): string {
  const type = getAttribute(`<c ${attrs}>`, "t");

  if (type === "s") {
    const index = Number(extractTagValue(body, "v"));
    return Number.isFinite(index) ? sharedStrings[index] ?? "" : "";
  }

  if (type === "inlineStr") {
    return decodeXml(extractTagValue(body, "t"));
  }

  return decodeXml(extractTagValue(body, "v"));
}

async function readZipText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) throw new Error(`Missing workbook file: ${path}`);
  return file.async("string");
}

function extractTagValue(xml: string, tagName: string): string {
  const match = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`).exec(xml);
  return match ? match[1] : "";
}

function getAttribute(tag: string, name: string): string {
  const escapedName = name.replace(":", "\\:");
  const match = new RegExp(`${escapedName}="([^"]*)"`).exec(tag);
  return match ? match[1] : "";
}

function columnNameToIndex(name: string): number {
  return name
    .toUpperCase()
    .split("")
    .reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function cleanCell(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function decodeSharedStringIndex(value: string, sharedStrings: string[]): string {
  if (!/^\d+$/.test(value)) return value;
  const index = Number(value);
  return sharedStrings[index] ?? value;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeHeader(value: string): string {
  return normalize(value).replace(/\s+/g, " ");
}

function decodeXml(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

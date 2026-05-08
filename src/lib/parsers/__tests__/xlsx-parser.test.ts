import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { parseFabricMappingWorkbook } from "../xlsx-parser";

const HEADERS = [
  "Source Sheet",
  "Pattern #",
  "Style #",
  "Option",
  "FL # / Code",
  "Supplier",
  "Construction",
  "Content",
  "Width (inch)",
  "Weight (g/m2)",
  "$/YD",
  "$/LB",
  "Finish",
  "Yarn Detail",
  "Comment",
  "Fabric CO",
  "Original FL Text",
];

describe("parseFabricMappingWorkbook", () => {
  it("parses the Style-Fabric Mapping worksheet", async () => {
    const workbook = await buildWorkbook([
      HEADERS,
      [
        "KNIT TOP",
        "PW272TALMJK010",
        "HDW227020",
        "opt2",
        "FL25122688",
        "Yourui",
        "Wide Rib",
        "56/38/6 Cotton/Polyester/Spandex",
        "49/51",
        "235",
        "2.08",
        "3.4",
        "",
        "BCI CO/RCP32'S + SP30D",
        "Old Navy BULK QTY",
        "China",
        "Option 2 - FL25122688",
      ],
    ]);

    const result = await parseFabricMappingWorkbook(workbook);

    expect(result.sheetName).toBe("Style-Fabric Mapping");
    expect(result.warnings).toEqual([]);
    expect(result.rows).toEqual([
      expect.objectContaining({
        styleId: "HDW227020",
        fabricCode: "FL25122688",
        supplier: "Yourui",
        construction: "Wide Rib",
        priceYd: "2.08",
        yarnDetail: "BCI CO/RCP32'S + SP30D",
      }),
    ]);
  });
});

async function buildWorkbook(rows: string[][]): Promise<ArrayBuffer> {
  const strings = [...new Set(rows.flat())];
  const stringIndex = new Map(strings.map((value, index) => [value, index]));
  const zip = new JSZip();

  zip.file(
    "xl/workbook.xml",
    '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Style-Fabric Mapping" sheetId="1" r:id="rId1"/></sheets></workbook>'
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    '<Relationships><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>'
  );
  zip.file(
    "xl/sharedStrings.xml",
    `<sst>${strings.map((value) => `<si><t>${escapeXml(value)}</t></si>`).join("")}</sst>`
  );
  zip.file("xl/worksheets/sheet1.xml", `<worksheet><sheetData>${rowsToXml(rows, stringIndex)}</sheetData></worksheet>`);

  return zip.generateAsync({ type: "arraybuffer" });
}

function rowsToXml(rows: string[][], stringIndex: Map<string, number>): string {
  return rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const ref = `${columnName(colIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="s"><v>${stringIndex.get(value) ?? 0}</v></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
}

function columnName(index: number): string {
  let name = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

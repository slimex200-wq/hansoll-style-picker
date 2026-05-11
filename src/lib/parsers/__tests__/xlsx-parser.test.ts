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

  it("does not shift columns when self-closing <c/> cells appear between valued cells", async () => {
    // Real Excel files emit `<c r=".." s=".."/>` for styled-but-empty cells.
    // The previous regex matched these as if they were normal opening tags and
    // pulled the FOLLOWING cell's <v> body into them, shifting every later
    // value (e.g. the user's HDW227106 row had FL code in Option, Construction
    // in Supplier, weight in Width, and a sharedStrings index leaked into $/YD).
    const layout = [
      { ref: "A2", value: "KNIT TOP", string: true },
      { ref: "B2", value: "PAT-1",    string: true },
      { ref: "C2", value: "STY-1",    string: true },
      { ref: "D2", value: "",         empty: true }, // Option blank
      { ref: "E2", value: "FL-CODE",  string: true },
      { ref: "F2", value: "",         empty: true }, // Supplier blank
      { ref: "G2", value: "Slub Jersey", string: true }, // Construction
      { ref: "H2", value: "100% Cotton", string: true }, // Content
      { ref: "I2", value: "",         empty: true }, // Width blank
      { ref: "J2", value: "190",      number: true }, // Weight 190
      { ref: "K2", value: "",         empty: true }, // $/YD blank
      { ref: "L2", value: "",         empty: true },
      { ref: "M2", value: "",         empty: true },
      { ref: "N2", value: "",         empty: true },
      { ref: "O2", value: "comment text", string: true },
      { ref: "P2", value: "",         empty: true },
      { ref: "Q2", value: "FL-CODE original", string: true },
    ];
    const workbook = await buildWorkbookCustom([HEADERS], layout);
    const result = await parseFabricMappingWorkbook(workbook);

    expect(result.rows[0]).toMatchObject({
      styleId: "STY-1",
      option: "",
      fabricCode: "FL-CODE",
      supplier: "",
      construction: "Slub Jersey",
      content: "100% Cotton",
      widthInch: "",
      weightGm2: "190",
      priceYd: "",
      priceLb: "",
      finish: "",
      yarnDetail: "",
      comment: "comment text",
      fabricCountry: "",
      originalText: "FL-CODE original",
    });
  });

  it("recovers shared string indexes from string columns", async () => {
    const workbook = await buildWorkbook(
      [
        HEADERS,
        [
          "KNIT TOP",
          "PW271TALMJK022",
          "HDW127271",
          "",
          "FL25102386",
          "",
          "2*2 Rib (hudson rib)",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "회사 시스템 등록 (hudson rib)",
          "",
          "FL25102386 (hudson rib)",
        ],
      ],
      new Set(["E2", "G2", "O2", "Q2"])
    );

    const result = await parseFabricMappingWorkbook(workbook);

    expect(result.rows[0]).toMatchObject({
      styleId: "HDW127271",
      option: "",
      fabricCode: "FL25102386",
      construction: "2*2 Rib (hudson rib)",
      comment: "회사 시스템 등록 (hudson rib)",
      originalText: "FL25102386 (hudson rib)",
    });
  });
});

interface CellSpec {
  ref: string;
  value: string;
  string?: boolean;
  number?: boolean;
  empty?: boolean;
}

async function buildWorkbookCustom(
  headerRows: string[][],
  dataCells: CellSpec[]
): Promise<ArrayBuffer> {
  const stringSet = new Set<string>(headerRows.flat());
  for (const c of dataCells) if (c.string) stringSet.add(c.value);
  const strings = [...stringSet];
  const stringIndex = new Map(strings.map((v, i) => [v, i]));
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
    `<sst>${strings.map((v) => `<si><t>${escapeXml(v)}</t></si>`).join("")}</sst>`
  );

  const headerXml = headerRows
    .map((row, rIdx) => {
      const cells = row
        .map((v, cIdx) => {
          const ref = `${columnName(cIdx)}${rIdx + 1}`;
          return `<c r="${ref}" t="s"><v>${stringIndex.get(v) ?? 0}</v></c>`;
        })
        .join("");
      return `<row r="${rIdx + 1}">${cells}</row>`;
    })
    .join("");

  const dataCellsXml = dataCells
    .map((c) => {
      if (c.empty) return `<c r="${c.ref}" s="15"/>`;
      if (c.number) return `<c r="${c.ref}" s="15"><v>${c.value}</v></c>`;
      const idx = stringIndex.get(c.value) ?? 0;
      return `<c r="${c.ref}" s="15" t="s"><v>${idx}</v></c>`;
    })
    .join("");
  const dataRowXml = `<row r="2">${dataCellsXml}</row>`;

  zip.file(
    "xl/worksheets/sheet1.xml",
    `<worksheet><sheetData>${headerXml}${dataRowXml}</sheetData></worksheet>`
  );
  return zip.generateAsync({ type: "arraybuffer" });
}

async function buildWorkbook(
  rows: string[][],
  rawSharedStringRefs = new Set<string>()
): Promise<ArrayBuffer> {
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
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<worksheet><sheetData>${rowsToXml(rows, stringIndex, rawSharedStringRefs)}</sheetData></worksheet>`
  );

  return zip.generateAsync({ type: "arraybuffer" });
}

function rowsToXml(
  rows: string[][],
  stringIndex: Map<string, number>,
  rawSharedStringRefs: Set<string>
): string {
  return rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const ref = `${columnName(colIndex)}${rowIndex + 1}`;
          if (rawSharedStringRefs.has(ref)) {
            return `<c r="${ref}"><v>${stringIndex.get(value) ?? 0}</v></c>`;
          }
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

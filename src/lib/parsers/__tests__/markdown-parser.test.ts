import { describe, it, expect } from "vitest";
import { parseMarkdownStyles } from "../markdown-parser";

const SINGLE_STYLE = `
|STYLE #|HDW127051|
|---|---|
|FABRIC #|FL25102386|
|CONTENTS|95/5 COTTON/SPANDEX|
|CONSTRUCTION|2*2 RIB|
|WEIGHT|225 G/M\u00B2|
|FINISHING| |
|DESIGNED BY|HANSOLL|

COMMENTS: * FABRIC SUGGESTION

FL25102427POINTELLE 95/5 COTTON/SPANDEX 220 G/M\u00B2
`;

const TWO_STYLES = `
HANSOLL Sample Collection

|STYLE #|HDW127051|
|---|---|
|FABRIC #|FL25102386|
|CONTENTS|95/5 COTTON/SPANDEX|
|CONSTRUCTION|2*2 RIB|
|WEIGHT|225 G/M\u00B2|
|FINISHING| |
|DESIGNED BY|HANSOLL|

FL25102427POINTELLE 95/5 COTTON/SPANDEX 220 G/M\u00B2

|STYLE #|HDW127079|
|---|---|
|FABRIC #|HS-1027-H|
|CONTENTS|100 COTTON|
|CONSTRUCTION|SINGLE JERSEY|
|WEIGHT|265 G/M\u00B2|
|FINISHING| |
|DESIGNED BY|HANSOLL|

FL25062903SINGLE JERSEY 100 COTTON 230 G/M\u00B2
`;

const TXT_SECTION = `
Some knit top content

|STYLE #|HDW127051|
|---|---|
|FABRIC #|FL25102386|
|CONTENTS|95/5 COTTON/SPANDEX|
|CONSTRUCTION|2*2 RIB|
|WEIGHT|225 G/M\u00B2|
|FINISHING| |
|DESIGNED BY|HANSOLL|

SP'27 TXT TALBOTS OUTLET

|STYLE #|HDW126092|
|---|---|
|FABRIC #|FL24022159|
|CONTENTS|71/15/14 COTTON/MODAL/POLYESTER|
|CONSTRUCTION|FRENCH TERRY|
|WEIGHT|250 G/M\u00B2|
|FINISHING| |
|DESIGNED BY|HANSOLL|
`;

const T_BY_TALBOTS_SECTION = `
For T by Talbots

HANSOLL Sample Collection

|STYLE #|HMW320041|
|---|---|
|FABRIC #| |
|CONTENTS|63/34/3 COTTON/POLYESTER/SPANDEX|
|CONSTRUCTION|SINGLE JACQUARD|
|WEIGHT|224 G/M\u00B2|
|FINISHING| |
|DESIGNED BY|BERSHKA|

FL25082416QUILT JACQUARD 83/15/2 POLYESTER/RAYON/SPANDEX 300 G/M\u00B2
`;

describe("parseMarkdownStyles", () => {
  it("parses a single style table", () => {
    const result = parseMarkdownStyles(SINGLE_STYLE);

    expect(result.styles).toHaveLength(1);
    expect(result.errors).toHaveLength(0);

    const style = result.styles[0];
    expect(style.style_id).toBe("HDW127051");
    expect(style.fabric_no).toBe("FL25102386");
    expect(style.contents).toBe("95/5 COTTON/SPANDEX");
    expect(style.construction).toBe("2*2 RIB");
    expect(style.weight).toBe("225 G/M2");
    expect(style.finishing).toBe("");
    expect(style.designed_by).toBe("HANSOLL");
  });

  it("parses fabric suggestion", () => {
    const result = parseMarkdownStyles(SINGLE_STYLE);
    const fs = result.styles[0].fabric_suggestion;

    expect(fs).not.toBeNull();
    expect(fs!.fabric_no).toBe("FL25102427");
    expect(fs!.construction).toBe("POINTELLE");
    expect(fs!.contents).toBe("95/5 COTTON/SPANDEX");
    expect(fs!.weight).toBe("220 G/M2");
  });

  it("parses multiple styles", () => {
    const result = parseMarkdownStyles(TWO_STYLES);

    expect(result.styles).toHaveLength(2);
    expect(result.styles[0].style_id).toBe("HDW127051");
    expect(result.styles[1].style_id).toBe("HDW127079");
  });

  it("detects TXT division from section header", () => {
    const result = parseMarkdownStyles(TXT_SECTION);

    expect(result.styles).toHaveLength(2);
    expect(result.styles[0].division).toBe("Knit Top");
    expect(result.styles[1].division).toBe("TXT");
  });

  it("detects T-BY-TALBOTS collection", () => {
    const result = parseMarkdownStyles(T_BY_TALBOTS_SECTION);

    expect(result.styles).toHaveLength(1);
    expect(result.styles[0].collection).toBe("T-BY-TALBOTS");
    expect(result.styles[0].style_id).toBe("HMW320041");
  });

  it("uses default collection and division", () => {
    const result = parseMarkdownStyles(SINGLE_STYLE, {
      defaultCollection: "MY-COLLECTION",
      defaultDivision: "My Division",
    });

    expect(result.styles[0].collection).toBe("MY-COLLECTION");
    expect(result.styles[0].division).toBe("My Division");
  });

  it("warns on duplicate style IDs", () => {
    const duplicate = SINGLE_STYLE + "\n" + SINGLE_STYLE;
    const result = parseMarkdownStyles(duplicate);

    expect(result.styles).toHaveLength(1);
    expect(result.warnings).toContain("Duplicate style ID: HDW127051");
  });

  it("returns error for empty document", () => {
    const result = parseMarkdownStyles("no tables here");

    expect(result.styles).toHaveLength(0);
    expect(result.errors).toContain("No style tables found in document");
  });

  it("handles empty fabric_no field", () => {
    const result = parseMarkdownStyles(T_BY_TALBOTS_SECTION);
    expect(result.styles[0].fabric_no).toBe("");
  });

  it("populates metadata with collections and divisions", () => {
    const result = parseMarkdownStyles(TXT_SECTION);

    expect(result.metadata.source).toBe("markdown");
    expect(result.metadata.divisions).toContain("Knit Top");
    expect(result.metadata.divisions).toContain("TXT");
  });

  it("normalizes weight format (G/M\u00B2 -> G/M2)", () => {
    const result = parseMarkdownStyles(SINGLE_STYLE);
    expect(result.styles[0].weight).toBe("225 G/M2");
  });
});

import { describe, expect, it } from "vitest";
import { parseMarkdownStyles } from "../markdown-parser";
import { reconstructTables } from "../pdf-parser";

describe("reconstructTables (horizontal SU'27 layout)", () => {
  it("parses a row with all 7 column values", () => {
    const text =
      "STYLE #  FABRIC #  CONTENTS  CONSTRUCTION  WEIGHT  FINISHING  DESIGNED BY  HDW227018  FL26032349  50/45/5 MODAL/COTTON/SPANDEX  2*2 RIB  270 G/M2  PEACH WASH  HANSOLL  COMMENTS:";
    const result = parseMarkdownStyles(reconstructTables(text));
    expect(result.styles).toHaveLength(1);
    expect(result.styles[0]).toMatchObject({
      style_id: "HDW227018",
      fabric_no: "FL26032349",
      contents: "50/45/5 MODAL/COTTON/SPANDEX",
      construction: "2*2 RIB",
      weight: "270 G/M2",
      finishing: "PEACH WASH",
      designed_by: "HANSOLL",
    });
  });

  it("treats the missing 6th value as an empty FINISHING (real SU'27 PDF case)", () => {
    const text =
      "STYLE #  FABRIC #  CONTENTS  CONSTRUCTION  WEIGHT  FINISHING  DESIGNED BY  HDW227037  FL25122228  100 COTTON  OTTOMAN  250 G/M2  HANSOLL  COMMENTS:";
    const result = parseMarkdownStyles(reconstructTables(text));
    expect(result.styles).toHaveLength(1);
    expect(result.styles[0]).toMatchObject({
      style_id: "HDW227037",
      fabric_no: "FL25122228",
      contents: "100 COTTON",
      construction: "OTTOMAN",
      weight: "250 G/M2",
      finishing: "",
      designed_by: "HANSOLL",
    });
  });

  it("parses multiple consecutive horizontal blocks (multi-page PDF)", () => {
    const text = [
      "STYLE #  FABRIC #  CONTENTS  CONSTRUCTION  WEIGHT  FINISHING  DESIGNED BY  HDW227018  FL26032349  50/45/5 MODAL/COTTON/SPANDEX  2*2 RIB  270 G/M2  HANSOLL  COMMENTS:",
      "STYLE #  FABRIC #  CONTENTS  CONSTRUCTION  WEIGHT  FINISHING  DESIGNED BY  HDW227037  FL25122228  100 COTTON  OTTOMAN  250 G/M2  HANSOLL  COMMENTS:",
    ].join(" ");
    const result = parseMarkdownStyles(reconstructTables(text));
    expect(result.styles).toHaveLength(2);
    expect(result.styles.map((s) => s.style_id)).toEqual(["HDW227018", "HDW227037"]);
  });
});

describe("reconstructTables", () => {
  it("builds markdown table rows from PDF text extracted on one line", () => {
    const text = [
      "STYLE # HDW127051",
      "FABRIC # FL25102386",
      "CONTENTS 95/5 COTTON/SPANDEX",
      "CONSTRUCTION 2*2 RIB",
      "WEIGHT 225 G/M2",
      "FINISHING",
      "DESIGNED BY HANSOLL",
      "COMMENTS: FABRIC SUGGESTION",
      "FL25102427 POINTELLE 95/5 COTTON/SPANDEX 220 G/M2",
    ].join(" ");

    const result = parseMarkdownStyles(reconstructTables(text));

    expect(result.styles).toHaveLength(1);
    expect(result.styles[0]).toMatchObject({
      style_id: "HDW127051",
      fabric_no: "FL25102386",
      contents: "95/5 COTTON/SPANDEX",
      construction: "2*2 RIB",
      weight: "225 G/M2",
      finishing: "",
      designed_by: "HANSOLL",
    });
    expect(result.styles[0].fabric_suggestion).toMatchObject({
      fabric_no: "FL25102427",
      contents: "95/5 COTTON/SPANDEX",
      weight: "220 G/M2",
    });
  });
});

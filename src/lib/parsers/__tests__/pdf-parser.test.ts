import { describe, expect, it } from "vitest";
import { parseMarkdownStyles } from "../markdown-parser";
import { reconstructTables } from "../pdf-parser";

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

import { describe, expect, it } from "vitest";
import {
  applySpecOverride,
  attachFabricDetailsFromRows,
  type FabricDetail,
} from "../fabric-details";
import type { Style } from "../types";

function makeStyle(overrides: Partial<Style> = {}): Style {
  return {
    id: "HDW227087",
    collection: "SU27-TALBOTS",
    division: "Knit Top",
    fabric_no: "WL0113-21",
    contents: "100 COTTON",
    construction: "SINGLE JERSEY",
    weight: "150 G/M2",
    finishing: "",
    designed_by: "HANSOLL",
    image_url: "",
    images: [],
    fabric_suggestion: null,
    ...overrides,
  };
}

function makeRow(overrides: Partial<FabricDetail> = {}): FabricDetail {
  return {
    sourceSheet: "MGF", pattern: "", styleId: "HDW227087", option: "",
    fabricCode: "WL0113-21", supplier: "woodland",
    construction: "Single Jersey", content: "100% Cotton",
    widthInch: "61", weightGm2: "150",
    priceYd: "2.25", priceLb: "",
    finish: "", yarnDetail: "", comment: "", fabricCountry: "",
    originalText: "WL0113-21",
    ...overrides,
  };
}

describe("applySpecOverride", () => {
  it("layers override values on top of raw columns", () => {
    const style = makeStyle({
      spec_override: { contents: "95/5 COTTON/SPANDEX", weight: "180 G/M2" },
    });
    const result = applySpecOverride(style);
    expect(result.contents).toBe("95/5 COTTON/SPANDEX");
    expect(result.weight).toBe("180 G/M2");
    // Untouched fields stay raw.
    expect(result.construction).toBe("SINGLE JERSEY");
    expect(result.designed_by).toBe("HANSOLL");
  });

  it("returns the style unchanged when override is null", () => {
    const style = makeStyle({ spec_override: null });
    expect(applySpecOverride(style)).toEqual(style);
  });

  it("ignores empty-string override values (treated as not set)", () => {
    const style = makeStyle({ spec_override: { contents: "   " } });
    expect(applySpecOverride(style).contents).toBe("100 COTTON");
  });
});

describe("attachFabricDetailsFromRows", () => {
  it("falls back to workbook mapping with no overrides", () => {
    const style = makeStyle();
    const row = makeRow();
    const [out] = attachFabricDetailsFromRows([style], [row]);
    expect(out.fabric_details).toEqual([row]);
    expect(out.contents).toBe("100 COTTON");
  });

  it("synthesises a single fabric row when fabric_override is set, seeding from spec", () => {
    const style = makeStyle({
      spec_override: { contents: "95/5 COTTON/SPANDEX", weight: "180 G/M2" },
      fabric_override: { fabricCode: "WL9999-99", supplier: "newco", priceYd: "3.10" },
    });
    const [out] = attachFabricDetailsFromRows([style], [makeRow()]);
    expect(out.fabric_details).toHaveLength(1);
    const detail = out.fabric_details![0];
    // Fabric override wins for its own keys.
    expect(detail.fabricCode).toBe("WL9999-99");
    expect(detail.supplier).toBe("newco");
    expect(detail.priceYd).toBe("3.10");
    // Spec override cascades to matched-card content/construction/weight.
    expect(detail.content).toBe("95/5 COTTON/SPANDEX");
    expect(detail.weightGm2).toBe("180");
    // Construction wasn't overridden — stays as the raw column value (since
    // applySpecOverride leaves it untouched and specSeed copies what's there).
    expect(detail.construction).toBe("SINGLE JERSEY");
  });

  it("overlays spec_override onto workbook rows when only spec is overridden", () => {
    const style = makeStyle({
      spec_override: { contents: "95/5 COTTON/SPANDEX" },
    });
    const [out] = attachFabricDetailsFromRows([style], [makeRow()]);
    expect(out.fabric_details).toHaveLength(1);
    const detail = out.fabric_details![0];
    expect(detail.content).toBe("95/5 COTTON/SPANDEX");
    // Workbook fields untouched by the spec override.
    expect(detail.fabricCode).toBe("WL0113-21");
    expect(detail.priceYd).toBe("2.25");
  });

  it("synthesises a row from spec_override alone when no workbook mapping exists", () => {
    const style = makeStyle({
      spec_override: { contents: "100% Linen", weight: "200 G/M2" },
    });
    const [out] = attachFabricDetailsFromRows([style], []);
    expect(out.fabric_details).toHaveLength(1);
    const detail = out.fabric_details![0];
    expect(detail.content).toBe("100% Linen");
    expect(detail.weightGm2).toBe("200");
    expect(detail.fabricCode).toBe("WL0113-21"); // from style.fabric_no
  });

  it("returns the style with no fabric_details when nothing matches", () => {
    const style = makeStyle();
    const [out] = attachFabricDetailsFromRows([style], []);
    expect(out.fabric_details).toBeUndefined();
  });
});

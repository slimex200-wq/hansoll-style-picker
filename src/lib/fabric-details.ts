import rawRows from "./data/fabric-detail-rows.json";
import type { StyleSpecOverride } from "./types";

/** Spec columns that the spec_override may replace. Keep in sync with
 *  StyleSpecOverride and the migration. */
const SPEC_COLUMN_KEYS = [
  "contents", "construction", "weight",
  "fabric_no", "division", "designed_by",
] as const;
type SpecColumnKey = (typeof SPEC_COLUMN_KEYS)[number];
type SpecCarrier = { [K in SpecColumnKey]?: string };

export interface FabricDetail {
  sourceSheet: string;
  pattern: string;
  styleId: string;
  option: string;
  fabricCode: string;
  supplier: string;
  construction: string;
  content: string;
  widthInch: string;
  weightGm2: string;
  priceYd: string;
  priceLb: string;
  finish: string;
  yarnDetail: string;
  comment: string;
  fabricCountry: string;
  originalText: string;
}

export const FABRIC_DETAIL_ROWS = rawRows as FabricDetail[];

interface FabricDetailsResponse {
  rows?: FabricDetail[];
}

export function getFabricDetailsForStyle(styleId: string): FabricDetail[] {
  return getFabricDetailsForStyleFromRows(styleId, FABRIC_DETAIL_ROWS);
}

export function getFabricDetailsForStyleFromRows(
  styleId: string,
  rows: FabricDetail[]
): FabricDetail[] {
  return indexFabricDetails(rows)[normalizeStyleId(styleId)] ?? [];
}

function emptyFabricDetail(styleId: string): FabricDetail {
  return {
    sourceSheet: "", pattern: "", styleId, option: "",
    fabricCode: "", supplier: "", construction: "", content: "",
    widthInch: "", weightGm2: "", priceYd: "", priceLb: "",
    finish: "", yarnDetail: "", comment: "", fabricCountry: "",
    originalText: "",
  };
}

/** Layer spec_override on top of the raw spec columns so the rest of the app
 *  can read `style.contents` etc. without knowing about the override. The
 *  underlying columns stay untouched in the DB. */
export function applySpecOverride<T extends SpecCarrier & { spec_override?: StyleSpecOverride | null }>(
  style: T
): T {
  const override = style.spec_override;
  if (!override) return style;
  const merged: SpecCarrier = {};
  let any = false;
  for (const key of SPEC_COLUMN_KEYS) {
    const value = override[key];
    if (typeof value === "string" && value.trim()) {
      merged[key] = value;
      any = true;
    }
  }
  return any ? { ...style, ...merged } : style;
}

export function attachFabricDetailsFromRows<
  T extends SpecCarrier & {
    id: string;
    fabric_override?: Partial<FabricDetail> | null;
    spec_override?: StyleSpecOverride | null;
  }
>(
  styles: T[],
  rows: FabricDetail[]
): Array<T & { fabric_details?: FabricDetail[] }> {
  const detailsByStyle = indexFabricDetails(rows);
  return styles.map((style) => {
    const withSpec = applySpecOverride(style);
    const hasFabricOverride = hasSomeValue(withSpec.fabric_override);
    const hasSpecOverride = hasSomeValue(style.spec_override);

    // Fabric override: synthesise a single corrected row. The spec values win
    // on content/construction/weightGm2 so changing the top spec automatically
    // flows into the matched card without the user re-entering those fields.
    if (hasFabricOverride) {
      const merged: FabricDetail = {
        ...emptyFabricDetail(withSpec.id),
        ...withSpec.fabric_override,
        ...specSeedForFabric(withSpec),
        styleId: withSpec.id,
      };
      return { ...withSpec, fabric_details: [merged] };
    }

    // Spec-only override: overlay the corrected spec onto each workbook row
    // (or synthesise a single row if the workbook has none) so the matched
    // card mirrors the corrected top spec.
    if (hasSpecOverride) {
      const seed = specSeedForFabric(withSpec);
      const workbookRows = detailsByStyle[normalizeStyleId(withSpec.id)] ?? [];
      if (workbookRows.length > 0) {
        const merged = workbookRows.map((row) => ({ ...row, ...seed }));
        return { ...withSpec, fabric_details: merged };
      }
      const synth: FabricDetail = {
        ...emptyFabricDetail(withSpec.id),
        ...seed,
        fabricCode: withSpec.fabric_no ?? "",
        styleId: withSpec.id,
      };
      return { ...withSpec, fabric_details: [synth] };
    }

    const fabricDetails = detailsByStyle[normalizeStyleId(withSpec.id)] ?? [];
    return fabricDetails.length > 0
      ? { ...withSpec, fabric_details: fabricDetails }
      : withSpec;
  });
}

/** Build a partial FabricDetail from the (post-override) top spec. Used to
 *  cascade the corrected top spec into the matched-fabric card so editing the
 *  top values automatically updates content/construction/weightGm2 there. */
function specSeedForFabric(style: SpecCarrier): Partial<FabricDetail> {
  const seed: Partial<FabricDetail> = {};
  if (style.contents?.trim()) seed.content = style.contents.trim();
  if (style.construction?.trim()) seed.construction = style.construction.trim();
  if (style.weight?.trim()) {
    // Weight strings are typically "150 G/M2" — pull the leading number only.
    // Stripping all non-digits would turn "200 G/M2" into "2002".
    const match = style.weight.match(/\d+(?:\.\d+)?/);
    if (match) seed.weightGm2 = match[0];
  }
  return seed;
}

function hasSomeValue(obj: object | null | undefined): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => typeof v === "string" && v.trim());
}

export async function attachFabricDetails<
  T extends SpecCarrier & {
    id: string;
    fabric_override?: Partial<FabricDetail> | null;
    spec_override?: StyleSpecOverride | null;
  }
>(
  styles: T[]
): Promise<Array<T & { fabric_details?: FabricDetail[] }>> {
  const rows = await fetchCurrentFabricDetails();
  return attachFabricDetailsFromRows(styles, rows);
}

async function fetchCurrentFabricDetails(): Promise<FabricDetail[]> {
  try {
    const response = await fetch("/api/fabric-details", { cache: "no-store" });
    if (!response.ok) return FABRIC_DETAIL_ROWS;
    const payload = (await response.json()) as FabricDetailsResponse;
    return Array.isArray(payload.rows) ? payload.rows : FABRIC_DETAIL_ROWS;
  } catch {
    return FABRIC_DETAIL_ROWS;
  }
}

function indexFabricDetails(rows: FabricDetail[]): Record<string, FabricDetail[]> {
  return rows.reduce<Record<string, FabricDetail[]>>((acc, detail) => {
    const key = normalizeStyleId(detail.styleId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(detail);
    return acc;
  }, {});
}

function normalizeStyleId(styleId: string): string {
  return styleId.trim().toUpperCase();
}

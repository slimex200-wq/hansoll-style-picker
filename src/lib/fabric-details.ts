import rawRows from "./data/fabric-detail-rows.json";

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

export function attachFabricDetailsFromRows<
  T extends { id: string; fabric_override?: Partial<FabricDetail> | null }
>(
  styles: T[],
  rows: FabricDetail[]
): Array<T & { fabric_details?: FabricDetail[] }> {
  const detailsByStyle = indexFabricDetails(rows);
  return styles.map((style) => {
    // Manual override takes precedence: it represents a single fabric row that
    // the admin entered/edited explicitly. Falls back to the workbook mapping
    // when no override is set.
    if (style.fabric_override && Object.values(style.fabric_override).some(Boolean)) {
      const merged: FabricDetail = {
        ...emptyFabricDetail(style.id),
        ...style.fabric_override,
        styleId: style.id,
      };
      return { ...style, fabric_details: [merged] };
    }
    const fabricDetails = detailsByStyle[normalizeStyleId(style.id)] ?? [];
    return fabricDetails.length > 0
      ? { ...style, fabric_details: fabricDetails }
      : style;
  });
}

export async function attachFabricDetails<T extends { id: string }>(
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

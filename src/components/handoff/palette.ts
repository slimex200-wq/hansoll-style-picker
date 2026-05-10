import type { SelectionStatus, Style } from "@/lib/types";
import type { FabricDetail } from "@/lib/fabric-details";

export const PALETTE = {
  bg: "#fbf8f3",
  panel: "#ffffff",
  rule: "#ebe6dc",
  ruleSoft: "#f3eee4",
  ink: "#1a1815",
  inkSoft: "#5a564f",
  inkLight: "#9a958c",
  peach: "#c96442",
  peachBg: "#fae9e1",
  sage: "#7a936f",
  sageBg: "#eef1ec",
  amber: "#b88a2c",
  amberBg: "#f6efdc",
} as const;

export const STATUS_META: Record<SelectionStatus, { label: string; color: string; bg: string }> = {
  shortlist: { label: "Pick", color: PALETTE.sage, bg: PALETTE.sageBg },
  maybe: { label: "Hold", color: PALETTE.amber, bg: PALETTE.amberBg },
  pass: { label: "Skip", color: PALETTE.peach, bg: PALETTE.peachBg },
};

export type FilterKey = "all" | "unreviewed" | SelectionStatus;
export type ViewMode = "list" | "gallery";

export function formatDisplayPrice(price?: string): string | null {
  if (!price) return null;
  const parsed = Number.parseFloat(price.replace(/[$,]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return `$${(parsed + 0.2).toFixed(2)}/YD`;
}

export function joinParts(...parts: Array<string | null | undefined | false>): string {
  return parts.filter(Boolean).join(" / ");
}

export function inferConstruction(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("terry")) return "French Terry";
  if (normalized.includes("jacquard")) return "Quilt Jacquard";
  if (normalized.includes("thermal")) return "Thermal";
  if (normalized.includes("rib")) return "Rib";
  if (normalized.includes("jersey")) return "Single Jersey";
  return "";
}

export function getFabricRows(style: Style): FabricDetail[] {
  if (style.fabric_details?.length) return style.fabric_details;
  if (!style.fabric_suggestion) return [];
  return [
    {
      sourceSheet: style.division,
      pattern: "",
      styleId: style.id,
      option: "mock",
      fabricCode: style.fabric_suggestion.fabric_no,
      supplier: "",
      construction: inferConstruction(style.fabric_suggestion.fabric_no),
      content: style.fabric_suggestion.contents,
      widthInch: "",
      weightGm2: style.fabric_suggestion.weight.replace(/[^0-9.]/g, ""),
      priceYd: "",
      priceLb: "",
      finish: "",
      yarnDetail: "",
      comment: "",
      fabricCountry: "",
      originalText: style.fabric_suggestion.fabric_no,
    },
  ];
}

export function getPrimaryFabric(style: Style): FabricDetail | null {
  return getFabricRows(style)[0] ?? null;
}

export function getFabricLabel(style: Style): string {
  const detail = getPrimaryFabric(style);
  if (detail) {
    return joinParts(detail.content, detail.construction || detail.originalText);
  }
  if (style.fabric_suggestion) {
    return joinParts(style.fabric_suggestion.contents, style.fabric_suggestion.fabric_no);
  }
  return joinParts(style.contents, style.construction);
}

export function getCollectionLabel(styles: Style[]): string {
  const raw = styles[0]?.collection;
  if (!raw) return "SP'27";
  const match = raw.match(/^(SP|SU|FA|FW|HO|SS)(\d{2})/i);
  return match ? `${match[1].toUpperCase()}'${match[2]}` : raw;
}

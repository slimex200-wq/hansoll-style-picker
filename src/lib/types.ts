import type { FabricDetail } from "./fabric-details";

export type SelectionStatus = "shortlist" | "maybe" | "pass";

export interface Style {
  id: string;
  collection: string;
  division: string;
  fabric_no: string;
  contents: string;
  construction: string;
  weight: string;
  finishing: string;
  designed_by: string;
  image_url: string;
  images: string[];
  fabric_image_url?: string | null;
  detail_image_url?: string | null;
  fabric_suggestion: {
    fabric_no: string;
    contents: string;
    weight: string;
  } | null;
  fabric_details?: FabricDetail[];
  /** Per-style manual override. When non-null, supplants the workbook mapping
   *  in attachFabricDetailsFromRows. Stored in styles.fabric_override (jsonb). */
  fabric_override?: Partial<FabricDetail> | null;
  /** Per-style manual override of the parsed PDF spec. When non-null,
   *  applySpecOverride layers these on top of the raw columns at fetch time so
   *  the displayed spec uses the corrected values. Stored in
   *  styles.spec_override (jsonb). */
  spec_override?: StyleSpecOverride | null;
}

export interface StyleSpecOverride {
  contents?: string;
  construction?: string;
  weight?: string;
  fabric_no?: string;
  division?: string;
  designed_by?: string;
}

export interface Selection {
  id: string;
  style_id: string;
  collection: string;
  user_id: string;
  user_name: string;
  status: SelectionStatus;
  created_at: string;
  updated_at: string;
}

export interface Memo {
  id: string;
  style_id: string;
  collection: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

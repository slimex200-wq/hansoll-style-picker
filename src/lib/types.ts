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

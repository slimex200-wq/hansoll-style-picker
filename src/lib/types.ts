export type SelectionStatus = "shortlist" | "maybe" | "pass";

export interface Style {
  id: string;
  collection: string;
  fabric_no: string;
  contents: string;
  construction: string;
  weight: string;
  finishing: string;
  designed_by: string;
  image_url: string;
  images: string[];
  fabric_suggestion: {
    fabric_no: string;
    contents: string;
    weight: string;
  } | null;
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

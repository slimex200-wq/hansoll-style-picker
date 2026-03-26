export interface ParsedFabricSuggestion {
  fabric_no: string;
  construction: string;
  contents: string;
  weight: string;
}

export interface ParsedImage {
  data: Uint8Array;
  mimeType: string;
  filename: string;
  pageIndex: number;
}

export interface ParsedStyle {
  style_id: string;
  fabric_no: string;
  contents: string;
  construction: string;
  weight: string;
  finishing: string;
  designed_by: string;
  division: string;
  collection: string;
  fabric_suggestion: ParsedFabricSuggestion | null;
  images: ParsedImage[];
  /** 1-based page number where this style was found */
  pageNum?: number;
}

export interface ParseResult {
  styles: ParsedStyle[];
  errors: string[];
  warnings: string[];
  metadata: {
    totalPages: number;
    source: "pdf" | "markdown";
    collections: string[];
    divisions: string[];
  };
}

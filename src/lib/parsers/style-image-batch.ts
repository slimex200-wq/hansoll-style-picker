export type StyleImageKind = "fabric" | "detail";

export interface StyleImageBatchEntry {
  filename: string;
  styleId: string;
  kind: StyleImageKind;
  ext: "jpg" | "jpeg" | "png" | "webp";
}

export interface StyleImageBatchSkip {
  filename: string;
  reason: string;
}

export interface StyleImageBatchParseResult {
  entries: StyleImageBatchEntry[];
  skipped: StyleImageBatchSkip[];
}

const SUPPORTED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

/**
 * Parse ZIP file names matching the convention `{styleId}_{kind}.{ext}`.
 *
 * - Style id may contain letters, digits, dashes, dots; everything before the
 *   final `_fabric` / `_detail` suffix is treated as the style id.
 * - kind is one of `fabric` | `detail` (case-insensitive).
 * - Hidden files (`__MACOSX`, leading dot) and directories are skipped.
 *
 * Pure function — no I/O, fully testable.
 */
export function parseStyleImageBatchNames(
  filenames: string[]
): StyleImageBatchParseResult {
  const entries: StyleImageBatchEntry[] = [];
  const skipped: StyleImageBatchSkip[] = [];

  for (const raw of filenames) {
    const filename = raw;
    if (!filename || filename.endsWith("/")) continue;

    // Strip leading directory paths (ZIPs often nest under a folder)
    const base = filename.split("/").pop() ?? filename;

    if (base.startsWith(".") || filename.includes("__MACOSX")) {
      continue;
    }

    const dot = base.lastIndexOf(".");
    if (dot < 0) {
      skipped.push({ filename, reason: "missing extension" });
      continue;
    }
    const stem = base.slice(0, dot);
    const ext = base.slice(dot + 1).toLowerCase();
    if (!SUPPORTED_EXT.has(ext)) {
      skipped.push({ filename, reason: `unsupported extension: ${ext}` });
      continue;
    }

    const sep = stem.lastIndexOf("_");
    if (sep <= 0 || sep === stem.length - 1) {
      skipped.push({
        filename,
        reason: 'naming must be "{styleId}_fabric.ext" or "{styleId}_detail.ext"',
      });
      continue;
    }

    const styleId = stem.slice(0, sep).trim();
    const kindToken = stem.slice(sep + 1).toLowerCase();

    if (!styleId) {
      skipped.push({ filename, reason: "empty styleId" });
      continue;
    }
    if (kindToken !== "fabric" && kindToken !== "detail") {
      skipped.push({
        filename,
        reason: `unknown kind "${kindToken}" (expected fabric or detail)`,
      });
      continue;
    }

    entries.push({
      filename,
      styleId,
      kind: kindToken,
      ext: ext as StyleImageBatchEntry["ext"],
    });
  }

  return { entries, skipped };
}

export function mimeTypeForExt(ext: StyleImageBatchEntry["ext"]): string {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

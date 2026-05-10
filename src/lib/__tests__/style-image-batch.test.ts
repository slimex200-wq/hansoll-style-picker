import { describe, it, expect } from "vitest";
import {
  mimeTypeForExt,
  parseStyleImageBatchNames,
} from "../parsers/style-image-batch";

describe("parseStyleImageBatchNames", () => {
  it("parses fabric and detail filenames", () => {
    const result = parseStyleImageBatchNames([
      "HDW127182_fabric.jpg",
      "HDW127079_detail.png",
    ]);
    expect(result.entries).toEqual([
      { filename: "HDW127182_fabric.jpg", styleId: "HDW127182", kind: "fabric", ext: "jpg" },
      { filename: "HDW127079_detail.png", styleId: "HDW127079", kind: "detail", ext: "png" },
    ]);
    expect(result.skipped).toEqual([]);
  });

  it("treats kind suffix case-insensitively", () => {
    const result = parseStyleImageBatchNames(["HDW1_FABRIC.JPG", "HDW2_Detail.WEBP"]);
    expect(result.entries.map((e) => `${e.styleId}:${e.kind}:${e.ext}`)).toEqual([
      "HDW1:fabric:jpg",
      "HDW2:detail:webp",
    ]);
  });

  it("strips leading directory paths from filenames", () => {
    const result = parseStyleImageBatchNames([
      "batch/HDW127182_fabric.jpg",
      "nested/folder/HMW320041_detail.jpeg",
    ]);
    expect(result.entries.map((e) => e.styleId)).toEqual(["HDW127182", "HMW320041"]);
  });

  it("preserves underscores in style ids by splitting on the last separator", () => {
    const result = parseStyleImageBatchNames(["STYLE_ABC_123_fabric.jpg"]);
    expect(result.entries[0]).toMatchObject({
      styleId: "STYLE_ABC_123",
      kind: "fabric",
    });
  });

  it("skips macOS metadata, hidden files, and directories", () => {
    const result = parseStyleImageBatchNames([
      "__MACOSX/HDW1_fabric.jpg",
      ".DS_Store",
      "subdir/",
    ]);
    expect(result.entries).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });

  it("records skips with reasons", () => {
    const result = parseStyleImageBatchNames([
      "no-extension",
      "HDW1_fabric.gif",
      "HDW1_unknown.jpg",
      "HDW1.jpg",
      "_fabric.jpg",
    ]);
    expect(result.entries).toHaveLength(0);
    expect(result.skipped).toEqual([
      { filename: "no-extension", reason: "missing extension" },
      { filename: "HDW1_fabric.gif", reason: "unsupported extension: gif" },
      {
        filename: "HDW1_unknown.jpg",
        reason: 'unknown kind "unknown" (expected fabric or detail)',
      },
      {
        filename: "HDW1.jpg",
        reason: 'naming must be "{styleId}_fabric.ext" or "{styleId}_detail.ext"',
      },
      {
        filename: "_fabric.jpg",
        reason: 'naming must be "{styleId}_fabric.ext" or "{styleId}_detail.ext"',
      },
    ]);
  });
});

describe("mimeTypeForExt", () => {
  it("maps extensions to mime types", () => {
    expect(mimeTypeForExt("jpg")).toBe("image/jpeg");
    expect(mimeTypeForExt("jpeg")).toBe("image/jpeg");
    expect(mimeTypeForExt("png")).toBe("image/png");
    expect(mimeTypeForExt("webp")).toBe("image/webp");
  });
});

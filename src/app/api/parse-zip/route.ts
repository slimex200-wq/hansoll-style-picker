import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import JSZip from "jszip";
import { parseMarkdownStyles } from "@/lib/parsers/markdown-parser";
import { uploadTempImage } from "@/lib/storage";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const collection = formData.get("collection") as string | undefined;

    if (!file) {
      return NextResponse.json({ error: "ZIP file required" }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 413 });
    }

    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    // Find markdown file
    const mdFiles = Object.keys(zip.files).filter((f) => f.endsWith(".md"));
    if (mdFiles.length === 0) {
      return NextResponse.json(
        { error: "No markdown file found in ZIP" },
        { status: 400 }
      );
    }

    const markdown = await zip.files[mdFiles[0]].async("string");
    const result = parseMarkdownStyles(markdown, {
      defaultCollection: collection,
    });

    // Find image files and map to styles
    const imageFiles = Object.keys(zip.files).filter(
      (f) => /\.(png|jpg|jpeg)$/i.test(f) && !zip.files[f].dir
    );

    // Build an image index from the markdown references
    const imageRefPattern = /!\[image \d+\]\(([^)]+)\)/g;
    const imageRefs: Array<{ ref: string; position: number }> = [];
    let match: RegExpExecArray | null;
    while ((match = imageRefPattern.exec(markdown)) !== null) {
      imageRefs.push({ ref: match[1], position: match.index });
    }

    // For each style, find the image refs near its position in the markdown
    const stylePositions = result.styles.map((s) => {
      const pos = markdown.indexOf(`|STYLE #|${s.style_id}|`);
      return { styleId: s.style_id, position: pos };
    });

    const styleImages: Record<string, string[]> = {};
    for (const sp of stylePositions) {
      const nearbyImages = imageRefs
        .filter((r) => r.position >= sp.position - 200 && r.position <= sp.position + 800)
        .map((r) => r.ref);
      if (nearbyImages.length > 0) {
        styleImages[sp.styleId] = nearbyImages.slice(0, 3);
      }
    }

    // Upload images to Supabase Storage and collect URLs per style
    const sessionId = randomUUID();
    const styleImageUrls: Record<string, string[]> = {};

    for (const [styleId, refs] of Object.entries(styleImages)) {
      styleImageUrls[styleId] = [];
      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        const zipKey = imageFiles.find((f) => f.endsWith(ref.split("/").pop()!));
        if (!zipKey) continue;
        try {
          const imgData = await zip.files[zipKey].async("uint8array");
          const ext = zipKey.toLowerCase().endsWith(".png") ? "png" : "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          const url = await uploadTempImage(
            imgData,
            mimeType,
            sessionId,
            `${styleId}-${i}.${ext}`
          );
          styleImageUrls[styleId].push(url);
        } catch {
          // Skip failed uploads
        }
      }
    }

    // Build response with image URLs per style
    const stylesWithUrls = result.styles.map((s) => ({
      style_id: s.style_id,
      fabric_no: s.fabric_no,
      contents: s.contents,
      construction: s.construction,
      weight: s.weight,
      finishing: s.finishing,
      designed_by: s.designed_by,
      division: s.division,
      collection: s.collection,
      fabric_suggestion: s.fabric_suggestion,
      image_urls: styleImageUrls[s.style_id] ?? [],
    }));

    return NextResponse.json({
      styles: stylesWithUrls,
      errors: result.errors,
      warnings: result.warnings,
      metadata: {
        ...result.metadata,
        sessionId,
        imageCount: imageFiles.length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `ZIP parsing failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

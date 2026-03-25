import { NextResponse } from "next/server";
import JSZip from "jszip";
import { parseMarkdownStyles } from "@/lib/parsers/markdown-parser";

export const maxDuration = 30;

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
    // opendataloader-pdf uses: ![image N](folder/imageFileN.png)
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

    // Map: find the image ref closest before each style
    const styleImages: Record<string, string[]> = {};
    for (const sp of stylePositions) {
      const nearbyImages = imageRefs
        .filter((r) => r.position >= sp.position - 200 && r.position <= sp.position + 800)
        .map((r) => r.ref);
      if (nearbyImages.length > 0) {
        styleImages[sp.styleId] = nearbyImages.slice(0, 3);
      }
    }

    // Convert image file data to base64 thumbnails for preview
    const imagePreview: Record<string, Array<{ filename: string; dataUrl: string }>> = {};
    for (const [styleId, refs] of Object.entries(styleImages)) {
      imagePreview[styleId] = [];
      for (const ref of refs) {
        // Find matching file in zip (the ref path might be relative)
        const zipKey = imageFiles.find((f) => f.endsWith(ref.split("/").pop()!));
        if (zipKey) {
          const imgData = await zip.files[zipKey].async("base64");
          const ext = zipKey.toLowerCase().endsWith(".png") ? "png" : "jpeg";
          imagePreview[styleId].push({
            filename: zipKey,
            dataUrl: `data:image/${ext};base64,${imgData}`,
          });
        }
      }
    }

    return NextResponse.json({
      ...result,
      imagePreview,
      metadata: {
        ...result.metadata,
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

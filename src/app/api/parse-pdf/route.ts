import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parsePdfBuffer } from "@/lib/parsers/pdf-parser";
import { uploadTempImage } from "@/lib/storage";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const collection = formData.get("collection") as string | undefined;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF file required" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 413 });
    }

    const buffer = await file.arrayBuffer();
    const result = await parsePdfBuffer(buffer, {
      defaultCollection: collection,
    });

    const sessionId = randomUUID();

    // Upload extracted images to Supabase Storage and collect URLs
    const stylesForPreview = await Promise.all(
      result.styles.map(async (s) => {
        const imageUrls: string[] = [];

        for (const img of s.images) {
          if (img.data.length === 0) continue;
          try {
            const url = await uploadTempImage(
              img.data,
              img.mimeType,
              sessionId,
              `${s.style_id}-${img.pageIndex}.png`
            );
            imageUrls.push(url);
          } catch {
            // Skip failed uploads
          }
        }

        return {
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
          image_urls: imageUrls,
          imageCount: s.images.length,
        };
      })
    );

    return NextResponse.json({
      styles: stylesForPreview,
      errors: result.errors,
      warnings: result.warnings,
      metadata: {
        ...result.metadata,
        sessionId,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `PDF parsing failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

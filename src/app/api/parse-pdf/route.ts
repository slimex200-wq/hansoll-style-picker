import { NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/parsers/pdf-parser";

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

    // text parsing 결과만 반환 (이미지는 client-side에서 추출)
    const stylesForPreview = result.styles.map((s) => ({
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
      pageNum: s.pageNum,
      image_urls: [] as string[],
    }));

    return NextResponse.json({
      styles: stylesForPreview,
      errors: result.errors,
      warnings: result.warnings,
      metadata: result.metadata,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `PDF parsing failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

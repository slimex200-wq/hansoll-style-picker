import { NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/parsers/pdf-parser";

export const maxDuration = 30;

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

    // Strip binary image data for response (return metadata only)
    const stylesForPreview = result.styles.map((s) => ({
      ...s,
      images: s.images.map((img) => ({
        filename: img.filename,
        mimeType: img.mimeType,
        pageIndex: img.pageIndex,
        hasData: img.data.length > 0,
      })),
    }));

    return NextResponse.json({
      ...result,
      styles: stylesForPreview,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `PDF parsing failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

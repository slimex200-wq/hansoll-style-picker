import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadStyleVariantImage } from "@/lib/storage";

export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Server Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (process.env.ADMIN_API_KEY && adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const styleId = (formData.get("styleId") as string | null)?.trim();
    const kindRaw = (formData.get("kind") as string | null)?.trim();
    const file = formData.get("file") as File | null;

    if (!styleId) {
      return NextResponse.json({ error: "styleId is required" }, { status: 400 });
    }
    if (kindRaw !== "fabric" && kindRaw !== "detail") {
      return NextResponse.json({ error: 'kind must be "fabric" or "detail"' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${file.type || "unknown"}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
    }

    const supabase = getServerSupabase();

    const { data: existing, error: lookupError } = await supabase
      .from("styles")
      .select("id, collection")
      .eq("id", styleId)
      .single();

    if (lookupError || !existing) {
      return NextResponse.json(
        { error: `Style not found: ${styleId}` },
        { status: 404 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const url = await uploadStyleVariantImage(
      buffer,
      file.type,
      existing.collection,
      styleId,
      kindRaw
    );

    const column = kindRaw === "fabric" ? "fabric_image_url" : "detail_image_url";
    const { error: updateError } = await supabase
      .from("styles")
      .update({ [column]: url })
      .eq("id", styleId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update style: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url, styleId, kind: kindRaw });
  } catch (e) {
    return NextResponse.json(
      { error: `Image upload failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

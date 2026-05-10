import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import {
  mimeTypeForExt,
  parseStyleImageBatchNames,
} from "@/lib/parsers/style-image-batch";
import { uploadStyleVariantImage } from "@/lib/storage";

export const maxDuration = 60;

const MAX_ZIP_BYTES = 100 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

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
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ZIP file required" }, { status: 400 });
    }
    if (file.size > MAX_ZIP_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 100MB)" },
        { status: 413 }
      );
    }

    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const allNames = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
    const { entries, skipped: namingSkipped } = parseStyleImageBatchNames(allNames);

    if (entries.length === 0) {
      return NextResponse.json({
        uploaded: [],
        skipped: namingSkipped,
        errors: [],
        message: 'No files matched naming convention "{styleId}_fabric.ext" or "{styleId}_detail.ext"',
      });
    }

    const styleIds = [...new Set(entries.map((e) => e.styleId))];
    const supabase = getServerSupabase();

    const { data: styleRows, error: lookupError } = await supabase
      .from("styles")
      .select("id, collection")
      .in("id", styleIds);

    if (lookupError) {
      return NextResponse.json(
        { error: `Style lookup failed: ${lookupError.message}` },
        { status: 500 }
      );
    }

    const collectionByStyleId = new Map<string, string>();
    for (const row of styleRows ?? []) {
      collectionByStyleId.set(row.id, row.collection);
    }

    const uploaded: Array<{ styleId: string; kind: string; url: string; filename: string }> = [];
    const errors: Array<{ filename: string; reason: string }> = [];
    const skipped: Array<{ filename: string; reason: string }> = [...namingSkipped];

    for (const entry of entries) {
      const collection = collectionByStyleId.get(entry.styleId);
      if (!collection) {
        skipped.push({
          filename: entry.filename,
          reason: `unknown styleId: ${entry.styleId}`,
        });
        continue;
      }

      try {
        const zipFile = zip.files[entry.filename];
        if (!zipFile) {
          errors.push({ filename: entry.filename, reason: "missing in zip" });
          continue;
        }

        const data = await zipFile.async("uint8array");
        if (data.byteLength > MAX_FILE_BYTES) {
          errors.push({
            filename: entry.filename,
            reason: `file too large (${data.byteLength} bytes, max ${MAX_FILE_BYTES})`,
          });
          continue;
        }

        const url = await uploadStyleVariantImage(
          data,
          mimeTypeForExt(entry.ext),
          collection,
          entry.styleId,
          entry.kind
        );

        const column =
          entry.kind === "fabric" ? "fabric_image_url" : "detail_image_url";
        const { error: updateError } = await supabase
          .from("styles")
          .update({ [column]: url })
          .eq("id", entry.styleId);

        if (updateError) {
          errors.push({
            filename: entry.filename,
            reason: `db update failed: ${updateError.message}`,
          });
          continue;
        }

        uploaded.push({
          styleId: entry.styleId,
          kind: entry.kind,
          url,
          filename: entry.filename,
        });
      } catch (e) {
        errors.push({
          filename: entry.filename,
          reason: (e as Error).message,
        });
      }
    }

    return NextResponse.json({ uploaded, skipped, errors });
  } catch (e) {
    return NextResponse.json(
      { error: `Batch upload failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

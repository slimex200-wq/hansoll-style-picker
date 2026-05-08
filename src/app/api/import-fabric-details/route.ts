import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseFabricMappingWorkbook } from "@/lib/parsers/xlsx-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

const FABRIC_MAPPING_PATH = "fabric-mappings/current.json";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Server Supabase env vars missing");
  }
  return createClient(url, serviceKey);
}

export async function POST(request: Request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Excel file required" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "Only .xlsx workbooks are supported" },
        { status: 400 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 });
    }

    const parsed = await parseFabricMappingWorkbook(await file.arrayBuffer());
    const updatedAt = new Date().toISOString();
    const payload = JSON.stringify(
      {
        sourceFile: file.name,
        sheetName: parsed.sheetName,
        updatedAt,
        rows: parsed.rows,
      },
      null,
      2
    );

    const { error } = await getServerSupabase()
      .storage.from("style-images")
      .upload(FABRIC_MAPPING_PATH, new Blob([payload], { type: "application/json" }), {
        cacheControl: "60",
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      throw new Error(`Fabric mapping upload failed: ${error.message}`);
    }

    return NextResponse.json({
      imported: parsed.rows.length,
      errors: [] as string[],
      warnings: parsed.warnings,
      sourceFile: file.name,
      sheetName: parsed.sheetName,
      updatedAt,
      sample: parsed.rows.slice(0, 5),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Fabric mapping import failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

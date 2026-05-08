import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { FabricDetail } from "@/lib/fabric-details";
import { parseFabricMappingWorkbook } from "@/lib/parsers/xlsx-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

const FABRIC_MAPPING_PATH = "fabric-mappings/current.json";

interface FabricMappingImportRequest {
  rows: FabricDetail[];
  sourceFile?: string;
  sheetName?: string;
  warnings?: string[];
}

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

    const parsed = await readImportRequest(request);
    const updatedAt = new Date().toISOString();
    const payload = JSON.stringify(
      {
        sourceFile: parsed.sourceFile,
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
      sourceFile: parsed.sourceFile,
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

async function readImportRequest(request: Request): Promise<{
  rows: FabricDetail[];
  warnings: string[];
  sourceFile: string;
  sheetName: string;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as FabricMappingImportRequest;
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      throw new Error("rows[] is required");
    }
    return {
      rows: body.rows,
      warnings: body.warnings ?? [],
      sourceFile: body.sourceFile ?? "uploaded workbook",
      sheetName: body.sheetName ?? "Style-Fabric Mapping",
    };
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new Error("Excel file required");
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Only .xlsx workbooks are supported");
  }

  const parsed = await parseFabricMappingWorkbook(await file.arrayBuffer());
  return {
    rows: parsed.rows,
    warnings: parsed.warnings,
    sourceFile: file.name,
    sheetName: parsed.sheetName,
  };
}

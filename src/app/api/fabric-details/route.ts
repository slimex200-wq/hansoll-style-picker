import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FABRIC_DETAIL_ROWS, type FabricDetail } from "@/lib/fabric-details";

export const runtime = "nodejs";

const FABRIC_MAPPING_PATH = "fabric-mappings/current.json";

interface FabricMappingPayload {
  rows?: FabricDetail[];
  sourceFile?: string;
  updatedAt?: string;
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getServerSupabase();

  if (!supabase) {
    return NextResponse.json({
      rows: FABRIC_DETAIL_ROWS,
      source: "static",
    });
  }

  const { data, error } = await supabase.storage
    .from("style-images")
    .download(FABRIC_MAPPING_PATH);

  if (error || !data) {
    return NextResponse.json({
      rows: FABRIC_DETAIL_ROWS,
      source: "static",
    });
  }

  try {
    const payload = JSON.parse(await data.text()) as FabricMappingPayload;
    return NextResponse.json({
      rows: Array.isArray(payload.rows) ? payload.rows : FABRIC_DETAIL_ROWS,
      source: "uploaded",
      sourceFile: payload.sourceFile,
      updatedAt: payload.updatedAt,
    });
  } catch {
    return NextResponse.json({
      rows: FABRIC_DETAIL_ROWS,
      source: "static",
    });
  }
}

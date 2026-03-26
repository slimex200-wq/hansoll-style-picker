import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Server Supabase env vars missing");
  }
  return createClient(url, serviceKey);
}

interface ImportStyle {
  style_id: string;
  fabric_no: string;
  contents: string;
  construction: string;
  weight: string;
  finishing: string;
  designed_by: string;
  division: string;
  fabric_suggestion: {
    fabric_no: string;
    construction: string;
    contents: string;
    weight: string;
  } | null;
  image_urls?: string[];
}

interface ImportRequest {
  collection: string;
  styles: ImportStyle[];
}

export async function POST(request: Request) {
  try {
    // Simple admin key check
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ImportRequest;

    if (!body.collection || !body.styles || body.styles.length === 0) {
      return NextResponse.json(
        { error: "collection and styles[] are required" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < body.styles.length; i += batchSize) {
      const batch = body.styles.slice(i, i + batchSize);

      const rows = batch.map((style) => {
        const row: Record<string, unknown> = {
          id: style.style_id,
          collection: body.collection,
          division: style.division,
          fabric_no: style.fabric_no,
          contents: style.contents,
          construction: style.construction,
          weight: style.weight,
          finishing: style.finishing,
          designed_by: style.designed_by,
          fabric_suggestion: style.fabric_suggestion,
        };
        // Only overwrite image fields when URLs are actually provided
        if (style.image_urls && style.image_urls.length > 0) {
          row.image_url = style.image_urls[0];
          row.images = style.image_urls;
        }
        return row;
      });

      const { error } = await supabase
        .from("styles")
        .upsert(rows, { onConflict: "id", ignoreDuplicates: false });

      if (error) {
        for (const style of batch) {
          results.errors.push(`${style.style_id}: ${error.message}`);
        }
      } else {
        results.imported += batch.length;
      }
    }

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json(
      { error: `Import failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

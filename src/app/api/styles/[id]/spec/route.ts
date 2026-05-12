import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const ALLOWED_KEYS = new Set<string>([
  "contents", "construction", "weight",
  "fabric_no", "division", "designed_by",
]);
const MAX_VALUE_LENGTH = 500;

interface PatchBody {
  override?: Record<string, unknown> | null;
}

function sanitize(input: Record<string, unknown> | null | undefined): Record<string, string> | null {
  if (input == null) return null;
  const out: Record<string, string> = {};
  let any = false;
  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (trimmed.length > MAX_VALUE_LENGTH) {
      throw new Error(`${key} exceeds ${MAX_VALUE_LENGTH} chars`);
    }
    out[key] = trimmed;
    any = true;
  }
  return any ? out : null;
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/styles/[id]/spec">
) {
  try {
    const { id } = await ctx.params;
    const styleId = typeof id === "string" ? id.trim() : "";
    if (!styleId) {
      return NextResponse.json({ error: "style id required" }, { status: 400 });
    }

    const body = (await request.json()) as PatchBody;
    let cleaned: Record<string, string> | null;
    try {
      cleaned = sanitize(body.override ?? null);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }

    const supabase = getServiceRoleSupabase();
    const { data, error } = await supabase
      .from("styles")
      .update({ spec_override: cleaned })
      .eq("id", styleId)
      .select("id, spec_override")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to update spec override: ${error.message}` },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json({ error: `Style not found: ${styleId}` }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: `Spec override update failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

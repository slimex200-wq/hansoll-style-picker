import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/collections/[name]">
) {
  try {
    const { name } = await ctx.params;
    const collection = typeof name === "string" ? name.trim() : "";
    if (!collection) {
      return NextResponse.json({ error: "collection name required" }, { status: 400 });
    }

    const supabase = getServiceRoleSupabase();

    // Order matters: selections + memos hold style_id FKs into styles, so wipe
    // them before deleting styles to avoid FK violations.
    const sel = await supabase.from("selections").delete().eq("collection", collection).select("id");
    if (sel.error) throw new Error(`selections delete: ${sel.error.message}`);
    const mem = await supabase.from("memos").delete().eq("collection", collection).select("id");
    if (mem.error) throw new Error(`memos delete: ${mem.error.message}`);
    const sty = await supabase.from("styles").delete().eq("collection", collection).select("id");
    if (sty.error) throw new Error(`styles delete: ${sty.error.message}`);

    return NextResponse.json({
      data: {
        collection,
        deleted: {
          selections: sel.data?.length ?? 0,
          memos: mem.data?.length ?? 0,
          styles: sty.data?.length ?? 0,
        },
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Collection delete failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

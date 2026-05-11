import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

interface CollectionSummary {
  collection: string;
  styles: number;
  selections: number;
  memos: number;
}

export async function GET() {
  try {
    const supabase = getServiceRoleSupabase();

    const [stylesRes, selectionsRes, memosRes] = await Promise.all([
      supabase.from("styles").select("collection"),
      supabase.from("selections").select("collection"),
      supabase.from("memos").select("collection"),
    ]);

    if (stylesRes.error) throw new Error(`styles: ${stylesRes.error.message}`);
    if (selectionsRes.error) throw new Error(`selections: ${selectionsRes.error.message}`);
    if (memosRes.error) throw new Error(`memos: ${memosRes.error.message}`);

    const summary = new Map<string, CollectionSummary>();
    const bump = (collection: string, key: keyof Omit<CollectionSummary, "collection">) => {
      const existing = summary.get(collection) ?? {
        collection,
        styles: 0,
        selections: 0,
        memos: 0,
      };
      existing[key] += 1;
      summary.set(collection, existing);
    };

    for (const row of stylesRes.data ?? []) bump(row.collection as string, "styles");
    for (const row of selectionsRes.data ?? []) bump(row.collection as string, "selections");
    for (const row of memosRes.data ?? []) bump(row.collection as string, "memos");

    const data = [...summary.values()].sort((a, b) => a.collection.localeCompare(b.collection));
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to list collections: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

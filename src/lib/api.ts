import { getSupabase } from "./supabase";
import type { Style, Selection, SelectionStatus, Memo } from "./types";

export async function fetchStyles(collection?: string): Promise<Style[]> {
  let query = getSupabase().from("styles").select("*");
  if (collection) query = query.eq("collection", collection);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch styles: ${error.message}`);
  return data as Style[];
}

export async function fetchSelections(collection?: string): Promise<Selection[]> {
  let query = getSupabase().from("selections").select("*");
  if (collection) query = query.eq("collection", collection);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch selections: ${error.message}`);
  return data as Selection[];
}

export async function fetchMemos(collection?: string): Promise<Memo[]> {
  let query = getSupabase()
    .from("memos")
    .select("*")
    .order("created_at", { ascending: false });
  if (collection) query = query.eq("collection", collection);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch memos: ${error.message}`);
  return data as Memo[];
}

export async function upsertSelection(
  styleId: string,
  collection: string,
  userId: string,
  userName: string,
  status: SelectionStatus
): Promise<Selection> {
  const { data, error } = await getSupabase()
    .from("selections")
    .upsert(
      {
        style_id: styleId,
        collection,
        user_id: userId,
        user_name: userName,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "style_id,user_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save selection: ${error.message}`);
  return data as Selection;
}

export interface PaginatedMemos {
  data: Memo[];
  hasMore: boolean;
}

export async function fetchMemosByStyle(
  styleId: string,
  limit: number = 20,
  offset: number = 0
): Promise<PaginatedMemos> {
  const { data, error, count } = await getSupabase()
    .from("memos")
    .select("*", { count: "exact" })
    .eq("style_id", styleId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch memos: ${error.message}`);
  return {
    data: data as Memo[],
    hasMore: (count ?? 0) > offset + limit,
  };
}

export async function insertMemo(
  styleId: string,
  collection: string,
  userId: string,
  userName: string,
  content: string
): Promise<Memo> {
  const { data, error } = await getSupabase()
    .from("memos")
    .insert({
      style_id: styleId,
      collection,
      user_id: userId,
      user_name: userName,
      content,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save memo: ${error.message}`);
  return data as Memo;
}

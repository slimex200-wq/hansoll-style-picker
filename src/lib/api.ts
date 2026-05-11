import { getSupabase } from "./supabase";
import { attachFabricDetails } from "./fabric-details";
import type { Style, Selection, SelectionStatus, Memo } from "./types";

export async function fetchStyles(collection?: string): Promise<Style[]> {
  let query = getSupabase().from("styles").select("*");
  if (collection) query = query.eq("collection", collection);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch styles: ${error.message}`);
  return attachFabricDetails(data as Style[]);
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

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }
  return json.data as T;
}

export async function upsertSelection(
  styleId: string,
  collection: string,
  userId: string,
  userName: string,
  status: SelectionStatus
): Promise<Selection> {
  return postJson<Selection>("/api/selections", {
    styleId,
    collection,
    userId,
    userName,
    status,
  });
}

export async function deleteSelection(
  styleId: string,
  userId: string
): Promise<void> {
  const res = await fetch("/api/selections", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ styleId, userId }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `Failed to clear selection: ${res.status}`);
  }
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
  return postJson<Memo>("/api/memos", {
    styleId,
    collection,
    userId,
    userName,
    content,
  });
}

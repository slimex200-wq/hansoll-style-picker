import { supabase } from "./supabase";
import type { Style, Selection, SelectionStatus, Memo } from "./types";

const COLLECTION = "SP27-TALBOTS-OUTLET";

export async function fetchStyles(): Promise<Style[]> {
  const { data, error } = await supabase
    .from("styles")
    .select("*")
    .eq("collection", COLLECTION);

  if (error) throw new Error(`Failed to fetch styles: ${error.message}`);
  return data as Style[];
}

export async function fetchSelections(): Promise<Selection[]> {
  const { data, error } = await supabase
    .from("selections")
    .select("*")
    .eq("collection", COLLECTION);

  if (error) throw new Error(`Failed to fetch selections: ${error.message}`);
  return data as Selection[];
}

export async function fetchMemos(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("collection", COLLECTION)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch memos: ${error.message}`);
  return data as Memo[];
}

export async function upsertSelection(
  styleId: string,
  userId: string,
  userName: string,
  status: SelectionStatus
): Promise<Selection> {
  const { data, error } = await supabase
    .from("selections")
    .upsert(
      {
        style_id: styleId,
        collection: COLLECTION,
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

export async function insertMemo(
  styleId: string,
  userId: string,
  userName: string,
  content: string
): Promise<Memo> {
  const { data, error } = await supabase
    .from("memos")
    .insert({
      style_id: styleId,
      collection: COLLECTION,
      user_id: userId,
      user_name: userName,
      content,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save memo: ${error.message}`);
  return data as Memo;
}

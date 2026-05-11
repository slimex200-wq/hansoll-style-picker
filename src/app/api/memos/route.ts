import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MAX_CONTENT_LENGTH = 2000;

interface InsertBody {
  styleId?: unknown;
  collection?: unknown;
  userId?: unknown;
  userName?: unknown;
  content?: unknown;
}

function asNonEmptyString(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InsertBody;
    const styleId = asNonEmptyString(body.styleId);
    const collection = asNonEmptyString(body.collection);
    const userId = asNonEmptyString(body.userId);
    const userName = asNonEmptyString(body.userName);
    const content = asNonEmptyString(body.content, MAX_CONTENT_LENGTH);

    if (!styleId || !collection || !userId || !userName) {
      return NextResponse.json(
        { error: "styleId, collection, userId, userName are required" },
        { status: 400 }
      );
    }
    if (!content) {
      return NextResponse.json(
        { error: `content is required (max ${MAX_CONTENT_LENGTH} chars)` },
        { status: 400 }
      );
    }

    const { data, error } = await getServiceRoleSupabase()
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

    if (error) {
      return NextResponse.json(
        { error: `Failed to save memo: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: `Memo insert failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

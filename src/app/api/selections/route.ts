import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["shortlist", "maybe", "pass"] as const;
type SelectionStatus = (typeof ALLOWED_STATUSES)[number];

interface UpsertBody {
  styleId?: unknown;
  collection?: unknown;
  userId?: unknown;
  userName?: unknown;
  status?: unknown;
}

interface DeleteBody {
  styleId?: unknown;
  userId?: unknown;
}

function asNonEmptyString(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpsertBody;
    const styleId = asNonEmptyString(body.styleId);
    const collection = asNonEmptyString(body.collection);
    const userId = asNonEmptyString(body.userId);
    const userName = asNonEmptyString(body.userName);
    const status = body.status;

    if (!styleId || !collection || !userId || !userName) {
      return NextResponse.json(
        { error: "styleId, collection, userId, userName are required" },
        { status: 400 }
      );
    }
    if (
      typeof status !== "string" ||
      !ALLOWED_STATUSES.includes(status as SelectionStatus)
    ) {
      return NextResponse.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await getServiceRoleSupabase()
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

    if (error) {
      return NextResponse.json(
        { error: `Failed to save selection: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: `Selection upsert failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteBody;
    const styleId = asNonEmptyString(body.styleId);
    const userId = asNonEmptyString(body.userId);

    if (!styleId || !userId) {
      return NextResponse.json(
        { error: "styleId and userId are required" },
        { status: 400 }
      );
    }

    const { error } = await getServiceRoleSupabase()
      .from("selections")
      .delete()
      .eq("style_id", styleId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { error: `Failed to clear selection: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: `Selection delete failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

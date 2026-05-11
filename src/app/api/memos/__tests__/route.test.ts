import { describe, it, expect, vi, beforeEach } from "vitest";

const insertResult = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  getServiceRoleSupabase: () => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: () => Promise.resolve(insertResult()),
        })),
      })),
    })),
  }),
}));

import { POST } from "../route";

beforeEach(() => {
  insertResult.mockReset();
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/memos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/memos", () => {
  it("returns 400 when content missing", async () => {
    const res = await POST(
      jsonRequest({
        styleId: "S1",
        collection: "C1",
        userId: "U1",
        userName: "Alice",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when content exceeds max length", async () => {
    const res = await POST(
      jsonRequest({
        styleId: "S1",
        collection: "C1",
        userId: "U1",
        userName: "Alice",
        content: "x".repeat(2001),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns saved memo on success", async () => {
    const saved = { id: "m1", content: "Hello" };
    insertResult.mockReturnValue({ data: saved, error: null });

    const res = await POST(
      jsonRequest({
        styleId: "S1",
        collection: "C1",
        userId: "U1",
        userName: "Alice",
        content: "Hello",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(saved);
  });

  it("returns 500 on supabase error", async () => {
    insertResult.mockReturnValue({ data: null, error: { message: "FK violation" } });
    const res = await POST(
      jsonRequest({
        styleId: "S1",
        collection: "C1",
        userId: "U1",
        userName: "Alice",
        content: "Hello",
      })
    );
    expect(res.status).toBe(500);
  });
});

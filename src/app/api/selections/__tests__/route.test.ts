import { describe, it, expect, vi, beforeEach } from "vitest";

const upsertResult = vi.fn();
const deleteResult = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  getServiceRoleSupabase: () => ({
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: () => Promise.resolve(upsertResult()),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: () => Promise.resolve(deleteResult()),
        })),
      })),
    })),
  }),
}));

import { POST, DELETE } from "../route";

beforeEach(() => {
  upsertResult.mockReset();
  deleteResult.mockReset();
});

function jsonRequest(method: string, body: unknown): Request {
  return new Request("http://localhost/api/selections", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/selections", () => {
  it("returns 400 when required fields missing", async () => {
    const res = await POST(jsonRequest("POST", { styleId: "S1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when status is invalid", async () => {
    const res = await POST(
      jsonRequest("POST", {
        styleId: "S1",
        collection: "C1",
        userId: "U1",
        userName: "Alice",
        status: "bogus",
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/status must be one of/);
  });

  it("rejects empty/whitespace strings", async () => {
    const res = await POST(
      jsonRequest("POST", {
        styleId: "   ",
        collection: "C1",
        userId: "U1",
        userName: "Alice",
        status: "shortlist",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns saved row on success", async () => {
    const saved = { id: "sel-1", style_id: "S1", status: "shortlist" };
    upsertResult.mockReturnValue({ data: saved, error: null });

    const res = await POST(
      jsonRequest("POST", {
        styleId: "S1",
        collection: "C1",
        userId: "U1",
        userName: "Alice",
        status: "shortlist",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(saved);
  });

  it("returns 500 with supabase error message", async () => {
    upsertResult.mockReturnValue({ data: null, error: { message: "Conflict" } });

    const res = await POST(
      jsonRequest("POST", {
        styleId: "S1",
        collection: "C1",
        userId: "U1",
        userName: "Alice",
        status: "maybe",
      })
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Conflict");
  });
});

describe("DELETE /api/selections", () => {
  it("returns 400 when styleId or userId missing", async () => {
    const res = await DELETE(jsonRequest("DELETE", { styleId: "S1" }));
    expect(res.status).toBe(400);
  });

  it("returns ok on success", async () => {
    deleteResult.mockReturnValue({ error: null });
    const res = await DELETE(jsonRequest("DELETE", { styleId: "S1", userId: "U1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 500 on supabase error", async () => {
    deleteResult.mockReturnValue({ error: { message: "DB down" } });
    const res = await DELETE(jsonRequest("DELETE", { styleId: "S1", userId: "U1" }));
    expect(res.status).toBe(500);
  });
});

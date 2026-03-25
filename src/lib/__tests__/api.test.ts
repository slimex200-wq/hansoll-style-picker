import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getSupabase before importing api module
const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: mockFrom }),
}));

import { fetchStyles, fetchSelections, fetchMemos, upsertSelection, insertMemo } from "../api";

function mockChain(terminal: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(terminal),
    then: undefined as unknown,
  };
  // Make chain thenable for non-single queries
  Object.defineProperty(chain, "then", {
    get() {
      return (resolve: (v: unknown) => void) => resolve(terminal);
    },
  });
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchStyles", () => {
  it("returns styles on success", async () => {
    const styles = [{ id: "S1" }];
    mockFrom.mockReturnValue(mockChain({ data: styles, error: null }));

    const result = await fetchStyles();
    expect(result).toEqual(styles);
    expect(mockFrom).toHaveBeenCalledWith("styles");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue(
      mockChain({ data: null, error: { message: "DB error" } })
    );

    await expect(fetchStyles()).rejects.toThrow("Failed to fetch styles: DB error");
  });
});

describe("fetchSelections", () => {
  it("returns selections on success", async () => {
    const selections = [{ id: "sel-1" }];
    mockFrom.mockReturnValue(mockChain({ data: selections, error: null }));

    const result = await fetchSelections();
    expect(result).toEqual(selections);
    expect(mockFrom).toHaveBeenCalledWith("selections");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue(
      mockChain({ data: null, error: { message: "Timeout" } })
    );

    await expect(fetchSelections()).rejects.toThrow("Failed to fetch selections");
  });
});

describe("fetchMemos", () => {
  it("returns memos on success", async () => {
    const memos = [{ id: "m1" }];
    const chain = mockChain({ data: memos, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await fetchMemos();
    expect(result).toEqual(memos);
    expect(mockFrom).toHaveBeenCalledWith("memos");
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue(
      mockChain({ data: null, error: { message: "Fail" } })
    );

    await expect(fetchMemos()).rejects.toThrow("Failed to fetch memos");
  });
});

describe("upsertSelection", () => {
  it("returns saved selection on success", async () => {
    const saved = { id: "sel-1", status: "shortlist" };
    const chain = mockChain({ data: saved, error: null });
    // Override single to return the selection
    chain.single.mockResolvedValue({ data: saved, error: null });
    // Make upsert return chain for select().single() chaining
    chain.upsert.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    const result = await upsertSelection("S1", "COL1", "U1", "Alice", "shortlist");
    expect(result).toEqual(saved);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        style_id: "S1",
        collection: "COL1",
        user_id: "U1",
        user_name: "Alice",
        status: "shortlist",
      }),
      { onConflict: "style_id,user_id" }
    );
  });

  it("throws on error", async () => {
    const chain = mockChain({ data: null, error: null });
    chain.single.mockResolvedValue({ data: null, error: { message: "Conflict" } });
    chain.upsert.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    await expect(
      upsertSelection("S1", "COL1", "U1", "Alice", "shortlist")
    ).rejects.toThrow("Failed to save selection");
  });
});

describe("insertMemo", () => {
  it("returns saved memo on success", async () => {
    const saved = { id: "m1", content: "Test" };
    const chain = mockChain({ data: saved, error: null });
    chain.single.mockResolvedValue({ data: saved, error: null });
    chain.insert.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    const result = await insertMemo("S1", "COL1", "U1", "Alice", "Test");
    expect(result).toEqual(saved);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        style_id: "S1",
        collection: "COL1",
        user_id: "U1",
        user_name: "Alice",
        content: "Test",
      })
    );
  });

  it("throws on error", async () => {
    const chain = mockChain({ data: null, error: null });
    chain.single.mockResolvedValue({ data: null, error: { message: "Insert fail" } });
    chain.insert.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    mockFrom.mockReturnValue(chain);

    await expect(
      insertMemo("S1", "COL1", "U1", "Alice", "Test")
    ).rejects.toThrow("Failed to save memo");
  });
});

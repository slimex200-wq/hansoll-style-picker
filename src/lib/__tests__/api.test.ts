import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock getSupabase before importing api module
const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: mockFrom }),
}));

import {
  fetchStyles,
  fetchSelections,
  fetchMemos,
  upsertSelection,
  deleteSelection,
  insertMemo,
} from "../api";

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

  it("attaches mapped fabric details to matching styles", async () => {
    mockFrom.mockReturnValue(mockChain({ data: [{ id: "HDW227020" }], error: null }));

    const result = await fetchStyles();

    expect(result[0].fabric_details).toEqual([
      expect.objectContaining({
        fabricCode: "FL25122688",
        supplier: "Yourui",
        construction: "Wide Rib",
        content: "56/38/6 Cotton/Polyester/Spandex",
      }),
    ]);
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

describe("upsertSelection (via /api/selections)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to /api/selections and returns saved row", async () => {
    const saved = { id: "sel-1", status: "shortlist" };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: saved }),
    });

    const result = await upsertSelection("S1", "COL1", "U1", "Alice", "shortlist");
    expect(result).toEqual(saved);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/selections");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      styleId: "S1",
      collection: "COL1",
      userId: "U1",
      userName: "Alice",
      status: "shortlist",
    });
  });

  it("throws with the API error message on failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Failed to save selection: Conflict" }),
    });

    await expect(
      upsertSelection("S1", "COL1", "U1", "Alice", "shortlist")
    ).rejects.toThrow("Failed to save selection: Conflict");
  });
});

describe("deleteSelection (via /api/selections)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends DELETE with styleId and userId", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    await deleteSelection("S1", "U1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/selections");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toEqual({ styleId: "S1", userId: "U1" });
  });

  it("throws with the API error on non-2xx", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "DB unreachable" }),
    });

    await expect(deleteSelection("S1", "U1")).rejects.toThrow("DB unreachable");
  });
});

describe("insertMemo (via /api/memos)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to /api/memos and returns saved memo", async () => {
    const saved = { id: "m1", content: "Test" };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: saved }),
    });

    const result = await insertMemo("S1", "COL1", "U1", "Alice", "Test");
    expect(result).toEqual(saved);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/memos");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      styleId: "S1",
      collection: "COL1",
      userId: "U1",
      userName: "Alice",
      content: "Test",
    });
  });

  it("throws with the API error message on failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Failed to save memo: Insert fail" }),
    });

    await expect(
      insertMemo("S1", "COL1", "U1", "Alice", "Test")
    ).rejects.toThrow("Failed to save memo: Insert fail");
  });
});

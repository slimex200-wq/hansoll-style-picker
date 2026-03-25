import { vi } from "vitest";

type MockResponse = { data: unknown; error: unknown; count?: number };

function createChain(response: MockResponse) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const self = () =>
    new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === "then") return undefined;
          if (!chain[prop]) {
            chain[prop] = vi.fn().mockReturnValue(self());
          }
          return chain[prop];
        },
      }
    );

  const proxy = self() as Record<string, unknown>;

  // Terminal methods return the response
  const terminalProxy = new Proxy(proxy, {
    get(target, prop: string) {
      if (prop === "then") {
        // Make it thenable — resolve with response when awaited
        return (resolve: (v: MockResponse) => void) => resolve(response);
      }
      const val = target[prop];
      if (typeof val === "function") {
        return (...args: unknown[]) => {
          (val as (...a: unknown[]) => unknown)(...args);
          return terminalProxy;
        };
      }
      return val;
    },
  });

  return terminalProxy;
}

export function createMockSupabase(responses?: Record<string, MockResponse>) {
  const defaultResponse: MockResponse = { data: [], error: null };

  const fromMock = vi.fn().mockImplementation((table: string) => {
    const response = responses?.[table] ?? defaultResponse;
    return createChain(response);
  });

  return {
    from: fromMock,
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://test.supabase.co/storage/v1/object/public/test/image.jpg" },
        }),
      }),
    },
  };
}

export function mockSupabaseModule(responses?: Record<string, MockResponse>) {
  const mockClient = createMockSupabase(responses);

  vi.mock("@/lib/supabase", () => ({
    getSupabase: () => mockClient,
  }));

  return mockClient;
}

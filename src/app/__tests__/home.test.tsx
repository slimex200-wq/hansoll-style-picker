import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../page";

// Mock api module
vi.mock("@/lib/api", () => ({
  fetchStyles: vi.fn(),
  fetchSelections: vi.fn(),
  fetchMemos: vi.fn(),
  fetchMemosByStyle: vi.fn(),
  upsertSelection: vi.fn(),
  insertMemo: vi.fn(),
}));

// Mock store module
vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  return {
    ...actual,
    getUserId: vi.fn(),
    getUserName: vi.fn(),
    setUserName: vi.fn(),
  };
});

// Mock Toast
vi.mock("@/components/Toast", () => ({
  showToast: vi.fn(),
  default: () => null,
}));

import { fetchStyles, fetchSelections, fetchMemos, fetchMemosByStyle, upsertSelection, insertMemo } from "@/lib/api";
import { getUserId, getUserName, setUserName } from "@/lib/store";

const mockStyles = [
  {
    id: "STYLE-001",
    collection: "SP27-TALBOTS-OUTLET",
    division: "Knit Top",
    fabric_no: "FL001",
    contents: "100% Cotton",
    construction: "Jersey",
    weight: "200 G/M2",
    finishing: "",
    designed_by: "Test",
    image_url: "/images/test.jpg",
    images: ["/images/test.jpg"],
    fabric_suggestion: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchStyles).mockResolvedValue(mockStyles);
  vi.mocked(fetchSelections).mockResolvedValue([]);
  vi.mocked(fetchMemos).mockResolvedValue([]);
  vi.mocked(fetchMemosByStyle).mockResolvedValue({ data: [], hasMore: false });
});

describe("Home", () => {
  it("shows NamePrompt when no user name is stored", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue(null);

    render(<Home />);

    expect(await screen.findByText("Hansoll Textile")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Sarah Kim")).toBeInTheDocument();
  });

  it("shows the handoff shell with the style id after name is set", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");

    render(<Home />);

    const matches = await screen.findAllByText("STYLE-001");
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByText(/1 shown from 1 styles/)).toBeInTheDocument();
  });

  it("shows a persistent load error when the collection cannot load", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");
    vi.mocked(fetchStyles).mockRejectedValue(new Error("Network unavailable"));

    render(<Home />);

    expect(await screen.findByText("Collection unavailable")).toBeInTheDocument();
    expect(screen.getByText("Network unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upload Data" })).toHaveAttribute("href", "/admin/upload");
  });

  it("loads memos in one batch instead of one request per style", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");
    vi.mocked(fetchMemos).mockResolvedValue([
      {
        id: "memo-1",
        style_id: "STYLE-001",
        collection: "SP27-TALBOTS-OUTLET",
        user_id: "user-123",
        user_name: "Alice",
        content: "Already noted",
        created_at: "2026-03-25T10:00:00Z",
      },
    ]);

    render(<Home />);

    expect(await screen.findByText("Already noted")).toBeInTheDocument();
    expect(fetchMemos).toHaveBeenCalledOnce();
    expect(fetchMemosByStyle).not.toHaveBeenCalled();
  });

  it("handles name submission from NamePrompt", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue(null);

    render(<Home />);

    const input = await screen.findByPlaceholderText("e.g. Sarah Kim");
    await userEvent.type(input, "Alice");
    await userEvent.click(screen.getByRole("button", { name: "View Collection" }));

    await waitFor(() => expect(setUserName).toHaveBeenCalledWith("Alice"));
  });

  it("selects a style row and reveals the detail panel", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");

    render(<Home />);

    const rows = await screen.findAllByRole("button", { name: /View details for style STYLE-001/ });
    expect(rows.length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "STYLE-001" })).toBeInTheDocument();
  });

  it("handles selection via the detail panel decision stack", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");
    vi.mocked(upsertSelection).mockResolvedValue({
      id: "sel-1",
      style_id: "STYLE-001",
      collection: "SP27-TALBOTS-OUTLET",
      user_id: "user-123",
      user_name: "Alice",
      status: "shortlist",
      created_at: "2026-03-25T10:00:00Z",
      updated_at: "2026-03-25T10:00:00Z",
    });

    render(<Home />);

    await screen.findByRole("heading", { name: "STYLE-001" });

    const pickButtons = await screen.findAllByRole("button", { name: "Mark Pick" });
    await userEvent.click(pickButtons[pickButtons.length - 1]);

    await waitFor(() =>
      expect(upsertSelection).toHaveBeenCalledWith("STYLE-001", "SP27-TALBOTS-OUTLET", "user-123", "Alice", "shortlist")
    );
  });

  it("handles memo addition via the Send button", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");
    vi.mocked(insertMemo).mockResolvedValue({
      id: "m1",
      style_id: "STYLE-001",
      collection: "SP27-TALBOTS-OUTLET",
      user_id: "user-123",
      user_name: "Alice",
      content: "Nice fabric",
      created_at: "2026-03-25T10:00:00Z",
    });

    render(<Home />);

    await screen.findByRole("heading", { name: "STYLE-001" });

    const textarea = screen.getByPlaceholderText("Add buyer or internal note...");
    fireEvent.change(textarea, { target: { value: "Nice fabric" } });
    expect(textarea).toHaveValue("Nice fabric");

    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(insertMemo).toHaveBeenCalledWith("STYLE-001", "SP27-TALBOTS-OUTLET", "user-123", "Alice", "Nice fabric")
    );
  });

  it("opens the selection summary modal from the sidebar button", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");

    render(<Home />);

    const summaryButton = await screen.findByRole("button", { name: /Selection summary/ });
    await userEvent.click(summaryButton);

    const dialog = await screen.findByRole("dialog", { name: "Selection summary" });
    expect(dialog).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close summary" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Selection summary" })).not.toBeInTheDocument()
    );
  });

  it("updates reviewed count when a selection exists", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");
    vi.mocked(fetchSelections).mockResolvedValue([
      {
        id: "sel-1",
        style_id: "STYLE-001",
        collection: "SP27-TALBOTS-OUTLET",
        user_id: "user-123",
        user_name: "Alice",
        status: "shortlist",
        created_at: "2026-03-25T10:00:00Z",
        updated_at: "2026-03-25T10:00:00Z",
      },
    ]);

    render(<Home />);

    expect(await screen.findByText(/1 shown from 1 styles · 1\/1 reviewed/)).toBeInTheDocument();
  });

  it("triggers a selection via the keyboard shortcut", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");
    vi.mocked(upsertSelection).mockResolvedValue({
      id: "sel-1",
      style_id: "STYLE-001",
      collection: "SP27-TALBOTS-OUTLET",
      user_id: "user-123",
      user_name: "Alice",
      status: "maybe",
      created_at: "2026-03-25T10:00:00Z",
      updated_at: "2026-03-25T10:00:00Z",
    });

    render(<Home />);

    await screen.findByRole("heading", { name: "STYLE-001" });

    fireEvent.keyDown(window, { key: "2" });

    await waitFor(() =>
      expect(upsertSelection).toHaveBeenCalledWith("STYLE-001", "SP27-TALBOTS-OUTLET", "user-123", "Alice", "maybe")
    );
  });

  it("ignores the keyboard shortcut while typing in a textarea", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");

    render(<Home />);

    await screen.findByRole("heading", { name: "STYLE-001" });

    const textarea = screen.getByPlaceholderText("Add buyer or internal note...");
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "1" });

    await waitFor(() => {
      expect(upsertSelection).not.toHaveBeenCalled();
    });
  });
});

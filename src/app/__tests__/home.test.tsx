import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../page";

// Mock api module
vi.mock("@/lib/api", () => ({
  fetchStyles: vi.fn(),
  fetchSelections: vi.fn(),
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

import { fetchStyles, fetchSelections, fetchMemosByStyle, upsertSelection, insertMemo } from "@/lib/api";
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
  vi.mocked(fetchMemosByStyle).mockResolvedValue({ data: [], hasMore: false });
});

describe("Home", () => {
  it("shows NamePrompt when no user name is stored", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue(null);

    render(<Home />);

    expect(await screen.findByText("Welcome")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
  });

  it("shows style grid after name is set", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");

    render(<Home />);

    expect(await screen.findByText("STYLE-001")).toBeInTheDocument();
    expect(screen.getByText(/0\/1 reviewed/)).toBeInTheDocument();
  });

  it("handles name submission from NamePrompt", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue(null);

    render(<Home />);

    const input = await screen.findByPlaceholderText("Enter your name");
    await userEvent.type(input, "Alice");
    await userEvent.click(screen.getByRole("button", { name: "View Collection" }));

    expect(setUserName).toHaveBeenCalledWith("Alice");
  });

  it("opens DetailDrawer when style card is clicked", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");

    render(<Home />);

    const card = await screen.findByRole("button", { name: /View details for style STYLE-001/ });
    await userEvent.click(card);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("handles selection via DetailDrawer", async () => {
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

    const card = await screen.findByRole("button", { name: /View details for style STYLE-001/ });
    await userEvent.click(card);

    await userEvent.click(screen.getByText("Shortlist"));

    expect(upsertSelection).toHaveBeenCalledWith("STYLE-001", "SP27-TALBOTS-OUTLET", "user-123", "Alice", "shortlist");
  });

  it("handles memo addition via DetailDrawer", async () => {
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

    const card = await screen.findByRole("button", { name: /View details for style STYLE-001/ });
    await userEvent.click(card);

    const textarea = screen.getByPlaceholderText("Add a memo...");
    await userEvent.type(textarea, "Nice fabric");
    await userEvent.click(screen.getByText("Send"));

    expect(insertMemo).toHaveBeenCalledWith("STYLE-001", "SP27-TALBOTS-OUTLET", "user-123", "Alice", "Nice fabric");
  });

  it("shows Summary link", async () => {
    vi.mocked(getUserId).mockReturnValue("user-123");
    vi.mocked(getUserName).mockReturnValue("Alice");

    render(<Home />);

    expect(await screen.findByText("Summary")).toBeInTheDocument();
  });

  it("updates reviewed count when selection exists", async () => {
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

    expect(await screen.findByText(/1\/1 reviewed/)).toBeInTheDocument();
  });
});

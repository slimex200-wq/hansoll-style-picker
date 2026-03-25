import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminPage from "../admin/page";
import type { Style, Selection, Memo } from "@/lib/types";

const mockStyles: Style[] = [
  {
    id: "STYLE-001",
    collection: "SP27-TALBOTS-OUTLET",
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

const mockSelections: Selection[] = [
  {
    id: "sel-1",
    style_id: "STYLE-001",
    collection: "SP27-TALBOTS-OUTLET",
    user_id: "user-1",
    user_name: "Alice",
    status: "shortlist",
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
  },
  {
    id: "sel-2",
    style_id: "STYLE-001",
    collection: "SP27-TALBOTS-OUTLET",
    user_id: "user-2",
    user_name: "Bob",
    status: "maybe",
    created_at: "2026-03-20T11:00:00Z",
    updated_at: "2026-03-20T11:00:00Z",
  },
];

// Memos deliberately NOT in chronological order to test sorting
const mockMemos: Memo[] = [
  {
    id: "memo-2",
    style_id: "STYLE-001",
    collection: "SP27-TALBOTS-OUTLET",
    user_id: "user-1",
    user_name: "Alice",
    content: "Old memo",
    created_at: "2026-03-20T09:00:00Z",
  },
  {
    id: "memo-3",
    style_id: "STYLE-001",
    collection: "SP27-TALBOTS-OUTLET",
    user_id: "user-2",
    user_name: "Bob",
    content: "Latest memo",
    created_at: "2026-03-20T12:00:00Z",
  },
  {
    id: "memo-1",
    style_id: "STYLE-001",
    collection: "SP27-TALBOTS-OUTLET",
    user_id: "user-1",
    user_name: "Alice",
    content: "Middle memo",
    created_at: "2026-03-20T10:00:00Z",
  },
];

vi.mock("@/lib/api", () => ({
  fetchStyles: vi.fn(),
  fetchSelections: vi.fn(),
  fetchMemos: vi.fn(),
}));

import { fetchStyles, fetchSelections, fetchMemos } from "@/lib/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminPage", () => {
  it("shows loading state initially", () => {
    vi.mocked(fetchStyles).mockReturnValue(new Promise(() => {}));
    vi.mocked(fetchSelections).mockReturnValue(new Promise(() => {}));
    vi.mocked(fetchMemos).mockReturnValue(new Promise(() => {}));

    render(<AdminPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders vote counts per style", async () => {
    vi.mocked(fetchStyles).mockResolvedValue(mockStyles);
    vi.mocked(fetchSelections).mockResolvedValue(mockSelections);
    vi.mocked(fetchMemos).mockResolvedValue([]);

    render(<AdminPage />);

    expect(await screen.findByText("STYLE-001")).toBeInTheDocument();
    expect(screen.getByText(/Shortlist 1/)).toBeInTheDocument();
    expect(screen.getByText(/Maybe 1/)).toBeInTheDocument();
  });

  it("shows 'No votes yet' when no selections exist", async () => {
    vi.mocked(fetchStyles).mockResolvedValue(mockStyles);
    vi.mocked(fetchSelections).mockResolvedValue([]);
    vi.mocked(fetchMemos).mockResolvedValue([]);

    render(<AdminPage />);

    expect(await screen.findByText("No votes yet")).toBeInTheDocument();
  });

  it("displays the LATEST memo (by created_at), not the first one in array", async () => {
    vi.mocked(fetchStyles).mockResolvedValue(mockStyles);
    vi.mocked(fetchSelections).mockResolvedValue([]);
    vi.mocked(fetchMemos).mockResolvedValue(mockMemos);

    render(<AdminPage />);

    // The latest memo is "Latest memo" (2026-03-20T12:00:00Z) by Bob
    // NOT "Old memo" which is first in the array
    expect(await screen.findByText("Latest memo")).toBeInTheDocument();
    expect(screen.queryByText("Old memo")).not.toBeInTheDocument();
    expect(screen.queryByText("Middle memo")).not.toBeInTheDocument();
  });

  it("shows reviewer count correctly", async () => {
    vi.mocked(fetchStyles).mockResolvedValue(mockStyles);
    vi.mocked(fetchSelections).mockResolvedValue(mockSelections);
    vi.mocked(fetchMemos).mockResolvedValue([]);

    render(<AdminPage />);

    expect(await screen.findByText(/2 reviewers/)).toBeInTheDocument();
  });
});

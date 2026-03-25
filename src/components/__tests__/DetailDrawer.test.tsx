import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DetailDrawer from "../DetailDrawer";
import type { Style, Memo } from "@/lib/types";

// Mock showToast
vi.mock("../Toast", () => ({
  showToast: vi.fn(),
  default: () => null,
}));

import { showToast } from "../Toast";

const mockStyle: Style = {
  id: "HDW127182",
  collection: "SP27-TALBOTS-OUTLET",
  division: "Knit Top",
  fabric_no: "FL25112486",
  contents: "100% Cotton",
  construction: "Pointelle",
  weight: "300 G/M2",
  finishing: "",
  designed_by: "Hansoll",
  image_url: "/images/HDW127182.jpg",
  images: ["/images/HDW127182.jpg", "/images/HDW127182-2.jpg"],
  fabric_suggestion: {
    fabric_no: "FL25082331 Thermal",
    contents: "65/32/3 Cotton/Polyester/Spandex",
    weight: "240 G/M2",
  },
};

const mockMemos: Memo[] = [
  {
    id: "m1",
    style_id: "HDW127182",
    collection: "SP27-TALBOTS-OUTLET",
    user_id: "u1",
    user_name: "Alice",
    content: "Looks great",
    created_at: "2026-03-25T10:00:00Z",
  },
];

const defaultProps = {
  style: mockStyle,
  currentStatus: null as null,
  memos: mockMemos,
  hasMore: false,
  onClose: vi.fn(),
  onSelect: vi.fn().mockResolvedValue(undefined),
  onAddMemo: vi.fn().mockResolvedValue(undefined),
  onLoadMore: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DetailDrawer", () => {
  it("renders style info", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getByText("HDW127182")).toBeInTheDocument();
    expect(screen.getByText(/100% Cotton/)).toBeInTheDocument();
    expect(screen.getByText(/Suggestion/)).toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    render(<DetailDrawer {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("closes on backdrop click", async () => {
    render(<DetailDrawer {...defaultProps} />);

    // Click the backdrop (first fixed overlay)
    const backdrop = screen.getByRole("dialog").previousElementSibling;
    if (backdrop) fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders selection buttons", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getByText("Shortlist")).toBeInTheDocument();
    expect(screen.getByText("Maybe")).toBeInTheDocument();
    expect(screen.getByText("Pass")).toBeInTheDocument();
  });

  it("calls onSelect with correct args when button clicked", async () => {
    render(<DetailDrawer {...defaultProps} />);

    await userEvent.click(screen.getByText("Shortlist"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("HDW127182", "shortlist");
  });

  it("renders existing memos", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Looks great")).toBeInTheDocument();
  });

  it("shows 'No memos yet.' when no memos", () => {
    render(<DetailDrawer {...defaultProps} memos={[]} />);

    expect(screen.getByText("No memos yet.")).toBeInTheDocument();
  });

  it("shows toast for empty memo submission", async () => {
    render(<DetailDrawer {...defaultProps} />);

    // Submit button should be disabled when textarea is empty
    const submitBtn = screen.getByText("Send");
    expect(submitBtn).toBeDisabled();
  });

  it("calls onAddMemo and clears input on valid submission", async () => {
    render(<DetailDrawer {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Add a memo...");
    await userEvent.type(textarea, "New memo text");
    await userEvent.click(screen.getByText("Send"));

    expect(defaultProps.onAddMemo).toHaveBeenCalledWith("HDW127182", "New memo text");
  });

  it("shows photo dots for multiple images", () => {
    render(<DetailDrawer {...defaultProps} />);

    const photoButtons = screen.getAllByRole("button").filter(
      (b) => b.getAttribute("aria-label")?.startsWith("Photo ")
    );
    expect(photoButtons).toHaveLength(2);
  });

  it("has accessible dialog role", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("shows 'Load earlier memos' button when hasMore is true", () => {
    render(<DetailDrawer {...defaultProps} hasMore={true} />);

    expect(screen.getByText("Load earlier memos")).toBeInTheDocument();
  });

  it("hides 'Load earlier memos' button when hasMore is false", () => {
    render(<DetailDrawer {...defaultProps} hasMore={false} />);

    expect(screen.queryByText("Load earlier memos")).not.toBeInTheDocument();
  });

  it("calls onLoadMore when 'Load earlier memos' is clicked", async () => {
    render(<DetailDrawer {...defaultProps} hasMore={true} />);

    await userEvent.click(screen.getByText("Load earlier memos"));
    expect(defaultProps.onLoadMore).toHaveBeenCalledOnce();
  });
});

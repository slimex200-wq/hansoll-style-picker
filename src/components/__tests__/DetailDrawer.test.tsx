import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DetailDrawer from "../DetailDrawer";
import type { Style, Memo } from "@/lib/types";

// Mock showToast
vi.mock("../Toast", () => ({
  showToast: vi.fn(),
  default: () => null,
}));

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
  fabric_details: [
    {
      sourceSheet: "KNIT TOP",
      pattern: "PW272TALMJK010",
      styleId: "HDW127182",
      option: "opt2",
      fabricCode: "FL25122688",
      supplier: "Yourui",
      construction: "Wide Rib",
      content: "56/38/6 Cotton/Polyester/Spandex",
      widthInch: "49/51",
      weightGm2: "235",
      priceYd: "2.08",
      priceLb: "3.4",
      finish: "",
      yarnDetail: "BCI CO/RCP32'S + SP30D",
      comment: "Old Navy BULK QTY",
      fabricCountry: "China",
      originalText: "Option 2 - FL25122688",
    },
  ],
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

const getDesktopDialog = () => within(screen.getAllByRole("dialog")[0]);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DetailDrawer", () => {
  it("renders style info", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getAllByText("HDW127182")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/100% Cotton/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Suggestion/)[0]).toBeInTheDocument();
  });

  it("renders matched fabric details", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getAllByText("MATCHED FABRIC")[0]).toBeInTheDocument();
    expect(screen.getAllByText("FL25122688")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Yourui / China")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Wide Rib/)[0]).toBeInTheDocument();
    expect(screen.getAllByText("Price: $2.28/YD / $3.60/LB")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/BCI CO\/RCP32'S/)[0]).toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    render(<DetailDrawer {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });
    return waitFor(() => expect(defaultProps.onClose).toHaveBeenCalledOnce());
  });

  it("closes on backdrop click", async () => {
    render(<DetailDrawer {...defaultProps} />);

    const backdrop = document.querySelector('[aria-hidden="true"]');
    if (backdrop) fireEvent.click(backdrop);
    await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalled());
  });

  it("renders selection buttons", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getAllByText("Shortlist")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Maybe")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Pass")[0]).toBeInTheDocument();
  });

  it("calls onSelect with correct args when button clicked", async () => {
    render(<DetailDrawer {...defaultProps} />);

    await userEvent.click(getDesktopDialog().getByText("Shortlist"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("HDW127182", "shortlist");
  });

  it("renders existing memos", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getAllByText("Alice")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Looks great")[0]).toBeInTheDocument();
  });

  it("shows 'No memos yet.' when no memos", () => {
    render(<DetailDrawer {...defaultProps} memos={[]} />);

    expect(screen.getAllByText("No memos yet.")[0]).toBeInTheDocument();
  });

  it("shows toast for empty memo submission", async () => {
    render(<DetailDrawer {...defaultProps} />);

    // Submit button should be disabled when textarea is empty
    const submitBtn = screen.getAllByText("Send")[0];
    expect(submitBtn).toBeDisabled();
  });

  it("calls onAddMemo and clears input on valid submission", async () => {
    render(<DetailDrawer {...defaultProps} />);

    const dialog = getDesktopDialog();
    const textarea = dialog.getByPlaceholderText("Add a memo...");
    fireEvent.change(textarea, { target: { value: "New memo text" } });
    expect(textarea).toHaveValue("New memo text");
    await userEvent.click(dialog.getByText("Send"));

    expect(defaultProps.onAddMemo).toHaveBeenCalledWith("HDW127182", "New memo text");
  });

  it("shows photo dots for multiple images", () => {
    render(<DetailDrawer {...defaultProps} />);

    const photoButtons = screen.getAllByRole("button").filter(
      (b) => b.getAttribute("aria-label")?.startsWith("Image ")
    );
    expect(photoButtons).toHaveLength(4);
  });

  it("has accessible dialog role", () => {
    render(<DetailDrawer {...defaultProps} />);

    expect(screen.getAllByRole("dialog")[0]).toHaveAttribute("aria-modal", "true");
  });

  it("shows 'Load earlier memos' button when hasMore is true", () => {
    render(<DetailDrawer {...defaultProps} hasMore={true} />);

    expect(screen.getAllByText("Load earlier memos")[0]).toBeInTheDocument();
  });

  it("hides 'Load earlier memos' button when hasMore is false", () => {
    render(<DetailDrawer {...defaultProps} hasMore={false} />);

    expect(screen.queryByText("Load earlier memos")).not.toBeInTheDocument();
  });

  it("calls onLoadMore when 'Load earlier memos' is clicked", async () => {
    render(<DetailDrawer {...defaultProps} hasMore={true} />);

    await userEvent.click(screen.getAllByText("Load earlier memos")[0]);
    expect(defaultProps.onLoadMore).toHaveBeenCalledOnce();
  });
});

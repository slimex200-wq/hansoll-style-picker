import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StyleCard from "../StyleCard";
import type { Style } from "@/lib/types";

const baseStyle: Style = {
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
  images: ["/images/HDW127182.jpg"],
  fabric_suggestion: null,
};

describe("StyleCard", () => {
  it("renders style id and fabric info", () => {
    render(<StyleCard style={baseStyle} status={null} memoCount={0} onClick={() => {}} />);

    expect(screen.getByText("HDW127182")).toBeInTheDocument();
    expect(screen.getByText(/100% Cotton/)).toBeInTheDocument();
    expect(screen.getByText(/Pointelle/)).toBeInTheDocument();
  });

  it("shows status badge when status is set", () => {
    render(<StyleCard style={baseStyle} status="shortlist" memoCount={0} onClick={() => {}} />);

    expect(screen.getByText("Shortlist")).toBeInTheDocument();
  });

  it("does not show badge when status is null", () => {
    render(<StyleCard style={baseStyle} status={null} memoCount={0} onClick={() => {}} />);

    expect(screen.queryByText("Shortlist")).not.toBeInTheDocument();
    expect(screen.queryByText("Maybe")).not.toBeInTheDocument();
    expect(screen.queryByText("Pass")).not.toBeInTheDocument();
  });

  it("shows memo count when > 0", () => {
    render(<StyleCard style={baseStyle} status={null} memoCount={3} onClick={() => {}} />);

    expect(screen.getByText("3 memos")).toBeInTheDocument();
  });

  it("hides memo count when 0", () => {
    render(<StyleCard style={baseStyle} status={null} memoCount={0} onClick={() => {}} />);

    expect(screen.queryByText(/memo/)).not.toBeInTheDocument();
  });

  it("shows singular 'memo' for count 1", () => {
    render(<StyleCard style={baseStyle} status={null} memoCount={1} onClick={() => {}} />);

    expect(screen.getByText("1 memo")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<StyleCard style={baseStyle} status={null} memoCount={0} onClick={onClick} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows fallback when no image_url", () => {
    const noImageStyle = { ...baseStyle, image_url: "" };
    render(<StyleCard style={noImageStyle} status={null} memoCount={0} onClick={() => {}} />);

    // Fallback shows the style id text
    const fallback = screen.getAllByText("HDW127182");
    expect(fallback.length).toBeGreaterThanOrEqual(1);
  });

  it("has accessible aria-label", () => {
    render(<StyleCard style={baseStyle} status={null} memoCount={0} onClick={() => {}} />);

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "View details for style HDW127182"
    );
  });
});

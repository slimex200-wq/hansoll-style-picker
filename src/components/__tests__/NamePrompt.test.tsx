import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NamePrompt from "../NamePrompt";

describe("NamePrompt", () => {
  it("renders welcome message", () => {
    render(<NamePrompt onSubmit={() => {}} />);

    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
  });

  it("disables button when input is empty", () => {
    render(<NamePrompt onSubmit={() => {}} />);

    expect(screen.getByRole("button", { name: "View Collection" })).toBeDisabled();
  });

  it("disables button when input is only whitespace", async () => {
    render(<NamePrompt onSubmit={() => {}} />);

    await userEvent.type(screen.getByPlaceholderText("Enter your name"), "   ");
    expect(screen.getByRole("button", { name: "View Collection" })).toBeDisabled();
  });

  it("calls onSubmit with trimmed name on form submit", async () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText("Enter your name"), "  Alice  ");
    await userEvent.click(screen.getByRole("button", { name: "View Collection" }));

    expect(onSubmit).toHaveBeenCalledWith("Alice");
  });

  it("does not call onSubmit when name is empty", async () => {
    const onSubmit = vi.fn();
    render(<NamePrompt onSubmit={onSubmit} />);

    // Try to submit without entering name (button should be disabled anyway)
    const button = screen.getByRole("button", { name: "View Collection" });
    expect(button).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ToastContainer, { showToast } from "../Toast";

describe("ToastContainer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock crypto.randomUUID
    vi.stubGlobal("crypto", {
      randomUUID: () => `uuid-${Date.now()}`,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders nothing when no toasts", () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe("");
  });

  it("shows toast message when showToast is called", () => {
    render(<ToastContainer />);

    act(() => {
      showToast("Test message", "success");
    });

    expect(screen.getByText(/Test message/)).toBeInTheDocument();
  });

  it("auto-removes toast after 3 seconds", () => {
    render(<ToastContainer />);

    act(() => {
      showToast("Temporary", "success");
    });

    expect(screen.getByText(/Temporary/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/Temporary/)).not.toBeInTheDocument();
  });

  it("applies success styling for success type", () => {
    render(<ToastContainer />);

    act(() => {
      showToast("OK", "success");
    });

    const toast = screen.getByText(/OK/).closest("div");
    expect(toast?.className).toContain("bg-green-600");
  });

  it("applies error styling for error type", () => {
    render(<ToastContainer />);

    act(() => {
      showToast("Fail", "error");
    });

    const toast = screen.getByText(/Fail/).closest("div");
    expect(toast?.className).toContain("bg-[#DC3545]");
  });
});

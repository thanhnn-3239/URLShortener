import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClickToCopy } from "@/components/ClickToCopy";

describe("ClickToCopy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies value to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<ClickToCopy value="http://localhost:3000/abc123" />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/abc123");
    expect(await screen.findByText(/copied!/i)).toBeInTheDocument();
  });

  it("shows fallback error when clipboard API fails", async () => {
    const writeText = vi
      .fn()
      .mockRejectedValue(new Error("clipboard disabled"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<ClickToCopy value="http://localhost:3000/abc123" />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(await screen.findByText(/unable to copy/i)).toBeInTheDocument();
  });
});

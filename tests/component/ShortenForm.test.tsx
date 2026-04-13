import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShortenForm } from "@/components/ShortenForm";

describe("ShortenForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation error when URL is invalid", async () => {
    render(<ShortenForm />);

    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "javascript:alert(1)" }
    });
    fireEvent.click(screen.getByRole("button", { name: /shorten url/i }));

    expect(await screen.findByText(/please enter a valid http\/https url/i)).toBeInTheDocument();
  });

  it("submits URL and renders returned short URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "abc123",
        short_url: "http://localhost:3000/abc123",
        destination_url: "https://example.com"
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ShortenForm />);

    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "https://example.com" }
    });
    fireEvent.click(screen.getByRole("button", { name: /shorten url/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/shorten",
        expect.objectContaining({ method: "POST" })
      );
    });

    expect(await screen.findByText(/short url is ready/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("http://localhost:3000/abc123")).toBeInTheDocument();
  });

  it("shows API error message when request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Failed to create short URL" })
      })
    );

    render(<ShortenForm />);

    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "https://example.com/error" }
    });
    fireEvent.click(screen.getByRole("button", { name: /shorten url/i }));

    expect(await screen.findByText(/failed to create short url/i)).toBeInTheDocument();
  });
});

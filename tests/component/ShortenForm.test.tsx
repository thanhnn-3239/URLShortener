import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShortenForm } from "@/components/ShortenForm";

describe("ShortenForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with neutral state before any submission", () => {
    render(<ShortenForm />);

    expect(screen.queryByText(/short url is ready/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/please enter a valid http\/https url/i)
    ).not.toBeInTheDocument();
  });

  it("shows validation error when URL is invalid", async () => {
    render(<ShortenForm />);

    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "javascript:alert(1)" }
    });
    fireEvent.click(screen.getByRole("button", { name: /shorten url/i }));

    expect(
      await screen.findByText(/please enter a valid http\/https url/i)
    ).toBeInTheDocument();
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
    expect(
      screen.getByDisplayValue("http://localhost:3000/abc123")
    ).toBeInTheDocument();
  });

  it("shows loading state while creating short URL", async () => {
    type MockFetchResponse = {
      ok: boolean;
      json: () => Promise<{
        code: string;
        short_url: string;
        destination_url: string;
      }>;
    };

    const deferred: { resolve: (value: MockFetchResponse) => void } = {
      resolve: () => undefined
    };
    const fetchPromise = new Promise<MockFetchResponse>((resolve) => {
      deferred.resolve = resolve;
    });

    vi.stubGlobal("fetch", vi.fn().mockReturnValue(fetchPromise));

    render(<ShortenForm />);

    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "https://example.com/loading" }
    });
    fireEvent.click(screen.getByRole("button", { name: /shorten url/i }));

    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();

    deferred.resolve({
      ok: true,
      json: async () => ({
        code: "load01",
        short_url: "http://localhost:3000/load01",
        destination_url: "https://example.com/loading"
      })
    });

    expect(await screen.findByText(/short url is ready/i)).toBeInTheDocument();
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

    expect(
      await screen.findByText(/failed to create short url/i)
    ).toBeInTheDocument();
  });
});

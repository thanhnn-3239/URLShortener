import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush })
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

function buildDashboardPayload(totalClicks: number) {
  return {
    dailyTrends: totalClicks > 0 ? [{ date: "2026-04-14", clicks: totalClicks }] : [],
    weeklyTrends: totalClicks > 0 ? [{ week: 16, startDate: "2026-04-13", clicks: totalClicks }] : [],
    topLinks:
      totalClicks > 0
        ? [
            {
              code: "abc123",
              destination_url: "https://example.com",
              click_count: totalClicks
            }
          ]
        : [],
    insights: {
      peakSource: totalClicks > 0 ? "direct" : null,
      peakDevice: totalClicks > 0 ? "desktop" : null,
      percentChange: totalClicks > 0 ? 100 : 0,
      trendDirection: totalClicks > 0 ? "up" : "flat"
    },
    totalClicks,
    dateRange: {
      startDate: "2026-03-15",
      endDate: "2026-04-14"
    }
  };
}

describe("DashboardPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it("shows loading state while dashboard request is pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise(() => {
            // Keep pending to assert loading UI.
          })
      )
    );

    const { container } = render(<DashboardPage />);

    await waitFor(() => {
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  it("shows error state and retry action when request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "boom" })
      })
    );

    render(<DashboardPage />);

    expect(await screen.findByText(/error loading dashboard/i)).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("shows empty state when no analytics data is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => buildDashboardPayload(0)
      })
    );

    render(<DashboardPage />);

    expect(await screen.findByText(/no data in this period/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create short url/i })).toBeInTheDocument();
  });

  it("shows dashboard chart and top links when data exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => buildDashboardPayload(3)
      })
    );

    render(<DashboardPage />);

    expect(await screen.findByText(/daily clicks trend/i)).toBeInTheDocument();
    expect(screen.getByText(/links/i)).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
  });
});

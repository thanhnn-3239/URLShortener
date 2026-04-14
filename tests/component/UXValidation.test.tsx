import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import TopLinksTable from "@/components/TopLinksTable";
import DashboardChart from "@/components/DashboardChart";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush })
}));

describe("UX validation", () => {
  it("keeps consistent typography and surface color tokens on home page", () => {
    const { container } = render(<HomePage />);

    const heroTitle = screen.getByRole("heading", {
      level: 1,
      name: /create compact links with room to grow into analytics/i
    });

    expect(heroTitle).toHaveClass("text-slate-950");
    expect(heroTitle).toHaveClass("text-5xl");

    const cards = container.querySelectorAll("article");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].className).toContain("border-slate-200");
  });

  it("exposes responsive utility classes for mobile, tablet, and desktop layouts", () => {
    const { container } = render(<HomePage />);

    const rootSection = container.querySelector("section");
    expect(rootSection?.className).toContain("lg:py-16");

    const gridBlock = container.querySelector(".grid");
    expect(gridBlock?.className).toMatch(/sm:|md:|lg:/);
  });

  it("meets baseline accessibility semantics for form, table, and chart widgets", () => {
    const { container } = render(<HomePage />);

    expect(screen.getByLabelText(/destination url/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /shorten url/i })).toBeInTheDocument();

    render(
      <TopLinksTable
        links={[
          {
            code: "abc123",
            destination_url: "https://example.com",
            click_count: 1
          }
        ]}
      />
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy abc123 to clipboard/i })).toBeInTheDocument();

    render(
      <DashboardChart
        title="Daily Clicks Trend"
        groupBy="daily"
        data={[{ date: "2026-04-14", clicks: 1 }]}
      />
    );

    expect(screen.getByRole("img", { name: /daily clicks trend chart/i })).toBeInTheDocument();
    expect(container.querySelectorAll("h1").length).toBe(1);
  });
});

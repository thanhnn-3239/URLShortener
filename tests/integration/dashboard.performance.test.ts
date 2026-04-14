import { describe, expect, it } from "vitest";
import { performance } from "node:perf_hooks";
import { GET as getDashboard } from "@/app/api/dashboard/route";
import { insert, resetTables } from "@/lib/database";
import { clearDashboardCache } from "@/services/analytics";

describe("dashboard performance", () => {
  it("loads dashboard in under 3s for 30-day range with 1000+ links", async () => {
    resetTables();
    clearDashboardCache();

    const startDate = "2026-03-14";
    const endDate = "2026-04-13";
    const baseDate = new Date("2026-04-13T00:00:00.000Z");

    const shortLinks = Array.from({ length: 1200 }, (_, index) => ({
      id: `sl-${index + 1}`,
      code: `code-${index + 1}`,
      destination_url: `https://example.com/${index + 1}`,
      created_at: new Date(baseDate.getTime() - index * 60_000).toISOString(),
      created_by: "perf-user",
      expires_at: null,
      is_active: true,
      click_count: 0
    }));

    await Promise.all(shortLinks.map((row) => insert("short_links", row)));

    const clickEvents = Array.from({ length: 3600 }, (_, index) => {
      const linkIndex = index % shortLinks.length;
      const dayOffset = index % 30;
      const clickedAt = new Date(baseDate);
      clickedAt.setUTCDate(clickedAt.getUTCDate() - dayOffset);

      return {
        id: `evt-${index + 1}`,
        short_link_id: shortLinks[linkIndex].id,
        clicked_at: clickedAt.toISOString(),
        source: index % 2 === 0 ? "search" : "social",
        device: index % 3 === 0 ? "desktop" : "mobile",
        ip_hash: null,
        user_agent_summary: null
      };
    });

    await Promise.all(clickEvents.map((row) => insert("click_events", row)));

    const startedAt = performance.now();
    const response = await getDashboard(
      new Request(
        `http://localhost:3000/api/dashboard?startDate=${startDate}&endDate=${endDate}&groupBy=daily`
      ) as any
    );
    const elapsedMs = performance.now() - startedAt;

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalClicks).toBe(3600);
    expect(data.topLinks.length).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(3000);
  }, 10_000);
});

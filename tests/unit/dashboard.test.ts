import { describe, it, expect } from "vitest";
import {
  formatDashboardData,
  aggregateByDay,
  aggregateByWeek,
  calculateInsights,
  getDashboardData,
  clearDashboardCache,
  refreshMaterializedViews
} from "@/services/analytics";
import type { ClickEvent } from "@/lib/types";
import { insert, resetTables, select } from "@/lib/database";

function makeClickEvent(overrides: Partial<ClickEvent> = {}): ClickEvent {
  return {
    id: "evt-1",
    short_link_id: "sl-1",
    clicked_at: new Date("2026-04-01T08:00:00Z").toISOString(),
    source: "direct",
    device: "desktop",
    ip_hash: null,
    user_agent_summary: null,
    ...overrides
  };
}

describe("Dashboard Data Formatting", () => {
  describe("getDashboardData caching and materialized view refresh", () => {
    it("returns cached dashboard data for the same parameters within TTL", async () => {
      resetTables();
      clearDashboardCache();

      await insert("short_links", {
        id: "sl-1",
        code: "abc123",
        destination_url: "https://example.com/cache",
        created_at: new Date("2026-04-01T00:00:00Z").toISOString(),
        created_by: "user-1",
        expires_at: null,
        is_active: true,
        click_count: 0
      });

      await insert("click_events", {
        id: "evt-1",
        short_link_id: "sl-1",
        clicked_at: new Date("2026-04-02T08:00:00Z").toISOString(),
        source: "direct",
        device: "desktop",
        ip_hash: null,
        user_agent_summary: null
      });

      const first = await getDashboardData({
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        groupBy: "daily"
      });

      await insert("click_events", {
        id: "evt-2",
        short_link_id: "sl-1",
        clicked_at: new Date("2026-04-03T08:00:00Z").toISOString(),
        source: "social",
        device: "mobile",
        ip_hash: null,
        user_agent_summary: null
      });

      const second = await getDashboardData({
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        groupBy: "daily"
      });

      expect(first.totalClicks).toBe(1);
      expect(second.totalClicks).toBe(1);
    });

    it("refreshes materialized views on demand", async () => {
      resetTables();
      clearDashboardCache();

      await insert("click_events", {
        id: "evt-1",
        short_link_id: "sl-1",
        clicked_at: new Date("2026-04-10T08:00:00Z").toISOString(),
        source: "direct",
        device: "desktop",
        ip_hash: null,
        user_agent_summary: null
      });

      const refresh = await refreshMaterializedViews(true);
      const dailyRows = await select("daily_clicks_mv");
      const weeklyRows = await select("weekly_clicks_mv");

      expect(refresh.refreshed).toBe(true);
      expect(dailyRows.length).toBeGreaterThan(0);
      expect(weeklyRows.length).toBeGreaterThan(0);
    });
  });

  describe("aggregateByDay", () => {
    it("should aggregate click events by date", () => {
      const clickEvents = [
        makeClickEvent({
          clicked_at: new Date("2026-04-01T08:00:00Z").toISOString(),
          source: "social",
          device: "mobile"
        }),
        makeClickEvent({
          clicked_at: new Date("2026-04-01T14:00:00Z").toISOString(),
          source: "direct",
          device: "desktop"
        }),
        makeClickEvent({
          clicked_at: new Date("2026-04-02T08:00:00Z").toISOString(),
          source: "social",
          device: "mobile"
        })
      ];

      const result = aggregateByDay(clickEvents);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe("2026-04-01");
      expect(result[0].clicks).toBe(2);
      expect(result[1].date).toBe("2026-04-02");
      expect(result[1].clicks).toBe(1);
    });

    it("should handle empty click events", () => {
      const result = aggregateByDay([]);
      expect(result).toEqual([]);
    });

    it("should format dates consistently (YYYY-MM-DD)", () => {
      const clickEvents = [
        makeClickEvent({
          clicked_at: new Date("2026-04-13T23:59:59Z").toISOString()
        })
      ];

      const result = aggregateByDay(clickEvents);
      expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("aggregateByWeek", () => {
    it("should aggregate click events by week", () => {
      const clickEvents = [
        makeClickEvent({
          clicked_at: new Date("2026-04-01T08:00:00Z").toISOString(),
          source: "social",
          device: "mobile"
        }),
        makeClickEvent({
          clicked_at: new Date("2026-04-06T08:00:00Z").toISOString(),
          source: "direct",
          device: "desktop"
        }),
        makeClickEvent({
          clicked_at: new Date("2026-04-07T08:00:00Z").toISOString(),
          source: "social",
          device: "mobile"
        })
      ];

      const result = aggregateByWeek(clickEvents);

      expect(result).toHaveLength(2);
      expect(result[0].clicks).toBe(1);
      expect(result[1].clicks).toBe(2);
    });

    it("should handle empty click events", () => {
      const result = aggregateByWeek([]);
      expect(result).toEqual([]);
    });

    it("should return week numbers and start dates", () => {
      const clickEvents = [
        makeClickEvent({
          clicked_at: new Date("2026-04-01T08:00:00Z").toISOString()
        })
      ];

      const result = aggregateByWeek(clickEvents);
      expect(result[0]).toHaveProperty("week");
      expect(result[0]).toHaveProperty("startDate");
      expect(result[0]).toHaveProperty("clicks");
    });
  });

  describe("calculateInsights", () => {
    it("should calculate peak source and device", () => {
      const clickEvents = [
        makeClickEvent({ source: "social", device: "mobile" }),
        makeClickEvent({ source: "social", device: "mobile", id: "evt-2" }),
        makeClickEvent({ source: "direct", device: "desktop", id: "evt-3" })
      ];

      const insights = calculateInsights(clickEvents);

      expect(insights.peakSource).toBe("social");
      expect(insights.peakDevice).toBe("mobile");
    });

    it("should calculate percent change from previous period", () => {
      const currentPeriod = [
        makeClickEvent({ source: "social", device: "mobile" }),
        makeClickEvent({ source: "social", device: "mobile", id: "evt-2" }),
        makeClickEvent({ source: "direct", device: "desktop", id: "evt-3" }),
        makeClickEvent({ source: "direct", device: "desktop", id: "evt-4" })
      ];
      const previousPeriod = [
        makeClickEvent({ source: "social", device: "mobile" }),
        makeClickEvent({ source: "social", device: "mobile", id: "evt-2" })
      ];

      const insights = calculateInsights(currentPeriod, previousPeriod);

      // 4 clicks current vs 2 clicks previous = 100% increase
      expect(insights.percentChange).toBe(100);
    });

    it("should calculate trend direction (up, down, flat)", () => {
      const increased = [
        makeClickEvent({ source: "social", device: "mobile" }),
        makeClickEvent({ source: "social", device: "mobile", id: "evt-2" }),
        makeClickEvent({ source: "direct", device: "desktop", id: "evt-3" })
      ];
      const baseline = [makeClickEvent({ source: "social", device: "mobile" })];

      const insights = calculateInsights(increased, baseline);
      expect(insights.trendDirection).toBe("up");
    });

    it("should set trend direction to down when clicks drop significantly", () => {
      const current = [
        makeClickEvent({ id: "evt-1", source: "social", device: "mobile" })
      ];
      const previous = [
        makeClickEvent({ id: "evt-2", source: "social", device: "mobile" }),
        makeClickEvent({ id: "evt-3", source: "direct", device: "desktop" }),
        makeClickEvent({ id: "evt-4", source: "search", device: "desktop" })
      ];

      const insights = calculateInsights(current, previous);
      expect(insights.trendDirection).toBe("down");
      expect(insights.percentChange).toBeLessThan(0);
    });

    it("should handle empty data gracefully", () => {
      const insights = calculateInsights([]);
      expect(insights).toHaveProperty("peakSource");
      expect(insights).toHaveProperty("peakDevice");
      expect(insights).toHaveProperty("percentChange");
    });
  });

  describe("formatDashboardData", () => {
    it("should format complete dashboard response", () => {
      const dashboardData = {
        shortLinks: [
          {
            code: "abc123",
            destination_url: "https://example.com",
            click_count: 10
          }
        ],
        clickEvents: [makeClickEvent({ source: "social", device: "mobile" })],
        dateRange: { startDate: "2026-04-01", endDate: "2026-04-13" }
      };

      const formatted = formatDashboardData(dashboardData);

      expect(formatted).toHaveProperty("dailyTrends");
      expect(formatted).toHaveProperty("weeklyTrends");
      expect(formatted).toHaveProperty("topLinks");
      expect(formatted).toHaveProperty("insights");
      expect(formatted).toHaveProperty("totalClicks");
    });

    it("should sort top links by click count descending", () => {
      const dashboardData = {
        shortLinks: [
          {
            code: "link1",
            destination_url: "https://one.com",
            click_count: 50
          },
          {
            code: "link2",
            destination_url: "https://two.com",
            click_count: 100
          },
          {
            code: "link3",
            destination_url: "https://three.com",
            click_count: 25
          }
        ],
        clickEvents: [],
        dateRange: { startDate: "2026-04-01", endDate: "2026-04-13" }
      };

      const formatted = formatDashboardData(dashboardData);

      expect(formatted.topLinks[0].code).toBe("link2");
      expect(formatted.topLinks[1].code).toBe("link1");
      expect(formatted.topLinks[2].code).toBe("link3");
    });

    it("should calculate total clicks from events", () => {
      const dashboardData = {
        shortLinks: [],
        clickEvents: [
          makeClickEvent({ source: "social", device: "mobile" }),
          makeClickEvent({ source: "direct", device: "desktop", id: "evt-2" }),
          makeClickEvent({ source: "social", device: "mobile", id: "evt-3" })
        ],
        dateRange: { startDate: "2026-04-01", endDate: "2026-04-13" }
      };

      const formatted = formatDashboardData(dashboardData);

      expect(formatted.totalClicks).toBe(3);
    });
  });
});

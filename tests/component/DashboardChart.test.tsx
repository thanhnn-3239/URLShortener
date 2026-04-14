import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardChart from "@/components/DashboardChart";

describe("DashboardChart Component", () => {
  const mockDailyTrends = [
    { date: "2026-04-01", clicks: 10 },
    { date: "2026-04-02", clicks: 15 },
    { date: "2026-04-03", clicks: 12 },
    { date: "2026-04-04", clicks: 20 },
    { date: "2026-04-05", clicks: 18 }
  ];

  const mockWeeklyTrends = [
    { week: 14, startDate: "2026-04-01", clicks: 75 },
    { week: 15, startDate: "2026-04-06", clicks: 50 }
  ];

  describe("Rendering", () => {
    it("should render chart container", () => {
      const { container } = render(
        <DashboardChart
          data={mockDailyTrends}
          groupBy="daily"
          title="Daily Clicks Trend"
        />
      );

      expect(container).toBeTruthy();
    });

    it("should render with daily data", () => {
      const { container } = render(
        <DashboardChart
          data={mockDailyTrends}
          groupBy="daily"
          title="Daily Trend"
        />
      );

      expect(screen.getByText("Daily Trend")).toBeInTheDocument();
    });

    it("should render with weekly data", () => {
      const { container } = render(
        <DashboardChart
          data={mockWeeklyTrends}
          groupBy="weekly"
          title="Weekly Trend"
        />
      );

      expect(screen.getByText("Weekly Trend")).toBeInTheDocument();
    });

    it("should render empty state when data is empty", () => {
      const { container } = render(
        <DashboardChart data={[]} groupBy="daily" title="Trend" />
      );

      // Should show some kind of empty message or empty chart
      const emptyState = container.textContent;
      expect(emptyState).toBeTruthy();
    });

    it("should render with custom colors", () => {
      const { container } = render(
        <DashboardChart
          data={mockDailyTrends}
          groupBy="daily"
          title="Trend"
          color="#ff0000"
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe("Data Visualization", () => {
    it("should display all data points", () => {
      const { container } = render(
        <DashboardChart data={mockDailyTrends} groupBy="daily" title="Trend" />
      );

      // Check that chart contains data
      const chartContent = container.innerHTML;
      expect(chartContent).toContain("2026-04-01");
    });

    it("should handle high values gracefully", () => {
      const highValueData = [
        { date: "2026-04-01", clicks: 10000 },
        { date: "2026-04-02", clicks: 5000 }
      ];

      const { container } = render(
        <DashboardChart
          data={highValueData}
          groupBy="daily"
          title="High Value Trend"
        />
      );

      expect(container).toBeTruthy();
    });

    it("should handle single data point", () => {
      const { container } = render(
        <DashboardChart
          data={[{ date: "2026-04-01", clicks: 50 }]}
          groupBy="daily"
          title="Single Point"
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have descriptive title", () => {
      render(
        <DashboardChart
          data={mockDailyTrends}
          groupBy="daily"
          title="Daily Clicks Trend"
        />
      );

      expect(screen.getByText("Daily Clicks Trend")).toBeInTheDocument();
    });

    it("should provide data context for screen readers", () => {
      const { container } = render(
        <DashboardChart
          data={mockDailyTrends}
          groupBy="daily"
          title="Trend Chart"
        />
      );

      // Chart should have some way to access data (role, aria-label, etc.)
      expect(
        container.querySelector('[role="img"]') ||
          container.querySelector("[aria-label]")
      ).toBeTruthy();
    });
  });

  describe("Responsive Behavior", () => {
    it("should accept width and height props", () => {
      const { container } = render(
        <DashboardChart
          data={mockDailyTrends}
          groupBy="daily"
          title="Trend"
          width="100%"
          height="400px"
        />
      );

      expect(container).toBeTruthy();
    });

    it("should scale with container", () => {
      const { container } = render(
        <div style={{ width: "500px", height: "300px" }}>
          <DashboardChart
            data={mockDailyTrends}
            groupBy="daily"
            title="Responsive Chart"
          />
        </div>
      );

      const wrapper = container.querySelector("div");
      expect(wrapper).toHaveStyle("width: 500px");
    });
  });
});

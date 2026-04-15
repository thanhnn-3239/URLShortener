"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DateRangePicker, {
  DateRangeChangeEvent
} from "@/components/DateRangePicker";
import { EmptyState } from "@/components/EmptyState";
import { logger } from "@/lib/logger";

const DashboardChart = dynamic(() => import("@/components/DashboardChart"), {
  ssr: false
});
const TopLinksTable = dynamic(() => import("@/components/TopLinksTable"), {
  ssr: false
});

interface DashboardData {
  dailyTrends: Array<{ date: string; clicks: number }>;
  weeklyTrends: Array<{ week: number; startDate: string; clicks: number }>;
  topLinks: Array<{
    code: string;
    destination_url: string;
    click_count: number;
  }>;
  insights: {
    peakSource: string | null;
    peakDevice: string | null;
    percentChange: number;
    trendDirection: "up" | "down" | "flat";
  };
  totalClicks: number;
  dateRange: { startDate: string; endDate: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [groupBy, setGroupBy] = useState<"daily" | "weekly">("daily");

  // Initialize with default date range (last 30 days)
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>(() => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0]
    };
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async (
    startDate = dateRange.startDate,
    endDate = dateRange.endDate,
    group = groupBy
  ) => {
    try {
      if (
        new Date(`${startDate}T00:00:00.000Z`) >
        new Date(`${endDate}T23:59:59.999Z`)
      ) {
        throw new Error("endDate must be after startDate");
      }

      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy: group
      });

      const response = await fetch(`/api/dashboard?${params}`);

      if (!response.ok) {
        let errorMessage = "Failed to fetch dashboard data";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON (e.g., HTML error page), use status message
          errorMessage = `Server error (${response.status}): ${response.statusText || "Unknown error"}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setDashboardData(data);

      logger.info("dashboard_loaded", {
        startDate,
        endDate,
        groupBy: group,
        totalClicks: data.totalClicks
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);

      logger.error("dashboard_fetch_error", {
        message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (event: DateRangeChangeEvent) => {
    setDateRange({ startDate: event.startDate, endDate: event.endDate });
    setGroupBy(event.groupBy);
    fetchDashboardData(event.startDate, event.endDate, event.groupBy);
  };

  const handleLinkClick = (code: string) => {
    router.push(`/api/analytics/${code}`);
  };

  const hasData = Boolean(dashboardData && dashboardData.totalClicks > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Track and analyze your short URL performance
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="mb-8">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            groupBy={groupBy}
            onRangeChange={handleRangeChange}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error loading dashboard</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => fetchDashboardData()}
              className="mt-4 px-4 py-2 rounded-lg bg-red-100 text-red-900 hover:bg-red-200 font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {dashboardData && !loading && hasData && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">
                  Total Clicks
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {dashboardData.totalClicks.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Peak Source</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 capitalize">
                  {dashboardData.insights.peakSource || "N/A"}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Peak Device</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 capitalize">
                  {dashboardData.insights.peakDevice || "N/A"}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Trend</p>
                <p className="mt-2 text-3xl font-bold">
                  <span
                    className={
                      dashboardData.insights.trendDirection === "up"
                        ? "text-green-600"
                        : dashboardData.insights.trendDirection === "down"
                          ? "text-red-600"
                          : "text-gray-600"
                    }
                  >
                    {dashboardData.insights.trendDirection === "up" && "↑"}
                    {dashboardData.insights.trendDirection === "down" && "↓"}
                    {dashboardData.insights.trendDirection === "flat" && "→"}
                  </span>
                  {Math.abs(dashboardData.insights.percentChange)}%
                </p>
              </div>
            </div>

            {/* Chart */}
            <DashboardChart
              data={
                groupBy === "daily"
                  ? dashboardData.dailyTrends
                  : dashboardData.weeklyTrends
              }
              groupBy={groupBy}
              title={
                groupBy === "daily"
                  ? "Daily Clicks Trend"
                  : "Weekly Clicks Trend"
              }
              height={400}
            />

            {/* Top Links Table */}
            <TopLinksTable
              links={dashboardData.topLinks}
              onLinkClick={handleLinkClick}
            />

            {/* Date Range Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-center text-gray-500 text-sm">
              <p>
                Showing data from {dashboardData.dateRange.startDate} to{" "}
                {dashboardData.dateRange.endDate}
              </p>
            </div>
          </div>
        )}

        {/* Empty State (No Data) */}
        {dashboardData && !loading && !hasData && (
          <EmptyState
            title="No data in this period"
            description="Create and share short URLs to start seeing analytics in your selected date range."
            action={
              <button
                onClick={() => router.push("/")}
                className="mt-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Create Short URL
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}

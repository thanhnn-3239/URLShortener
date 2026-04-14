"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export type DailyPoint = {
  date: string;
  clicks: number;
};

export type WeeklyPoint = {
  week: number;
  startDate: string;
  clicks: number;
};

interface DashboardChartProps {
  data: DailyPoint[] | WeeklyPoint[];
  groupBy?: "daily" | "weekly";
  title?: string;
  color?: string;
  width?: string | number;
  height?: string | number;
}

export default function DashboardChart({
  data,
  groupBy = "daily",
  title = "Clicks Trend",
  color = "#3b82f6",
  width = "100%",
  height = 300
}: DashboardChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold">No data available</p>
          <p className="text-sm">Try selecting a different date range</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((point) => {
    if ("date" in point) {
      return {
        label: point.date,
        clicks: point.clicks
      };
    } else {
      return {
        label: `Week ${point.week}`,
        startDate: point.startDate,
        clicks: point.clicks
      };
    }
  });
  const periodLabel = groupBy === "weekly" ? "Week" : "Date";
  const resolvedWidth =
    typeof width === "number"
      ? width
      : width.endsWith("%")
        ? (width as `${number}%`)
        : ("100%" as const);
  const resolvedHeight =
    typeof height === "number"
      ? height
      : height.endsWith("%")
        ? (height as `${number}%`)
        : Number.parseInt(height, 10) || 300;

  return (
    <div
      className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      role="img"
      aria-label={`${title} chart`}
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      <div className="sr-only" aria-hidden="false">
        {chartData
          .map((point) => `${point.label}: ${point.clicks} clicks`)
          .join(", ")}
      </div>

      <ResponsiveContainer width={resolvedWidth} height={resolvedHeight}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            label={{ value: periodLabel, position: "insideBottom", offset: -2 }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: `1px solid ${color}`,
              borderRadius: "8px"
            }}
            formatter={(value) => [value, "Clicks"]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="clicks"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            name="Clicks"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <p className="text-sm font-medium text-gray-600">Total Clicks</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {chartData
              .reduce((sum, point) => sum + point.clicks, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4">
          <p className="text-sm font-medium text-gray-600">Average/Period</p>
          <p className="mt-1 text-2xl font-bold text-green-900">
            {Math.round(
              chartData.reduce((sum, point) => sum + point.clicks, 0) /
                chartData.length
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

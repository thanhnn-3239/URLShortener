export type DailyPoint = {
  date: string;
  clicks: number;
};

export type WeeklyPoint = {
  week: number;
  startDate: string;
  clicks: number;
};

export type DashboardInsights = {
  peakSource: SourceType | null;
  peakDevice: DeviceType | null;
  percentChange: number;
  trendDirection: 'up' | 'down' | 'flat';
};

export type DashboardData = {
  dailyTrends: DailyPoint[];
  weeklyTrends: WeeklyPoint[];
  topLinks: Array<{ code: string; destination_url: string; click_count: number }>;
  insights: DashboardInsights;
  totalClicks: number;
  dateRange: { startDate: string; endDate: string };
};

import { NotFoundError, ValidationError } from "@/lib/errors";
import { select } from "@/lib/database";
import type { ClickEvent, DeviceType, SourceType } from "@/lib/types";

type DbShortLink = {
  id: string;
  code: string;
  destination_url: string;
  created_at: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  click_count: number;
};

type PerLinkStats = {
  code: string;
  destination_url: string;
  created_at: string;
  total_clicks: number;
  period: {
    start_date: string;
    end_date: string;
  };
  clicks_by_source: Partial<Record<SourceType, number>>;
  clicks_by_device: Partial<Record<DeviceType, number>>;
  daily_trend: DailyPoint[];
  consistency: {
    difference: number;
    ratio: number;
    withinTolerance: boolean;
  };
};

type DateRangeOptions = {
  startDate: string;
  endDate: string;
};

const SHORT_LINKS_TABLE = "short_links";
const CLICK_EVENTS_TABLE = "click_events";

function normalizeDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new ValidationError("start_date must be before end_date and within last 365 days");
  }

  return { start, end };
}

function tallyByKey<T extends string>(events: ClickEvent[], key: "source" | "device") {
  return events.reduce<Partial<Record<T, number>>>((accumulator, event) => {
    const bucket = event[key] as T;
    accumulator[bucket] = (accumulator[bucket] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function aggregateByDay(events: Array<{ clicked_at: string }>): DailyPoint[] {
  const grouped = new Map<string, number>();

  for (const event of events) {
    const date = new Date(event.clicked_at).toISOString().slice(0, 10);
    grouped.set(date, (grouped.get(date) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function performanceMetrics(clickCount: number, eventCount: number, tolerance = 0.01) {
  const difference = Math.abs(clickCount - eventCount);
  const ratio = clickCount === 0 ? 0 : Number((difference / clickCount).toFixed(2));

  return {
    difference,
    ratio,
    withinTolerance: ratio <= tolerance
  };
}

export async function getPerLinkStats(code: string, options: DateRangeOptions): Promise<PerLinkStats> {
  const { start, end } = normalizeDateRange(options.startDate, options.endDate);
  const [shortLink] = (await select(SHORT_LINKS_TABLE, { code })) as DbShortLink[];

  if (!shortLink) {
    throw new NotFoundError("Short URL not found");
  }
  const allEvents = (await select(CLICK_EVENTS_TABLE, { short_link_id: shortLink.id })) as unknown as ClickEvent[];
  const filteredEvents = allEvents.filter((event) => {
    const clickedAt = new Date(event.clicked_at);
    return clickedAt >= start && clickedAt <= end;
  });

  return {
    code: shortLink.code,
    destination_url: shortLink.destination_url,
    created_at: shortLink.created_at,
    total_clicks: filteredEvents.length,
    period: {
      start_date: options.startDate,
      end_date: options.endDate
    },
    clicks_by_source: tallyByKey<SourceType>(filteredEvents, "source"),
    clicks_by_device: tallyByKey<DeviceType>(filteredEvents, "device"),
    daily_trend: aggregateByDay(filteredEvents),
    consistency: performanceMetrics(shortLink.click_count, filteredEvents.length)
  };
}

export function aggregateByWeek(
  events: Array<{ clicked_at: string }>
): WeeklyPoint[] {
  const grouped = new Map<number, { startDate: string; clicks: number }>();

  for (const event of events) {
    const date = new Date(event.clicked_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Get Monday of the week
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekNumber = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    ) + 1;

    const startDateStr = weekStart.toISOString().split('T')[0];
    const existing = grouped.get(weekNumber) || { startDate: startDateStr, clicks: 0 };
    existing.clicks += 1;
    grouped.set(weekNumber, existing);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, data]) => ({
      week,
      startDate: data.startDate,
      clicks: data.clicks
    }));
}

export function calculateInsights(
  currentEvents: ClickEvent[],
  previousEvents?: ClickEvent[]
): DashboardInsights {
  const sourceCount = tallyByKey<SourceType>(currentEvents, 'source');
  const deviceCount = tallyByKey<DeviceType>(currentEvents, 'device');

  const peakSource = Object.entries(sourceCount).length > 0
    ? (Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0]?.[0] as SourceType | null)
    : null;

  const peakDevice = Object.entries(deviceCount).length > 0
    ? (Object.entries(deviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] as DeviceType | null)
    : null;

  const currentClickCount = currentEvents.length;
  const previousClickCount = previousEvents?.length ?? 0;

  let percentChange = 0;
  if (previousClickCount > 0) {
    percentChange = Math.round(((currentClickCount - previousClickCount) / previousClickCount) * 100);
  } else if (currentClickCount > 0) {
    percentChange = 100;
  }

  let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  if (percentChange > 5) trendDirection = 'up';
  else if (percentChange < -5) trendDirection = 'down';

  return {
    peakSource,
    peakDevice,
    percentChange,
    trendDirection
  };
}

export function formatDashboardData(data: {
  shortLinks: Array<{ code: string; destination_url: string; click_count: number }>;
  clickEvents: ClickEvent[];
  dateRange: { startDate: string; endDate: string };
}): DashboardData {
  const dailyTrends = aggregateByDay(data.clickEvents);
  const weeklyTrends = aggregateByWeek(data.clickEvents);
  const totalClicks = data.clickEvents.length;

  const topLinks = data.shortLinks
    .sort((a, b) => b.click_count - a.click_count)
    .slice(0, 10); // Top 10 links

  const insights = calculateInsights(data.clickEvents);

  return {
    dailyTrends,
    weeklyTrends,
    topLinks,
    insights,
    totalClicks,
    dateRange: data.dateRange
  };
}

export async function getDashboardData(
  options: DateRangeOptions & { groupBy?: 'daily' | 'weekly' }
): Promise<DashboardData> {
  const { start, end } = normalizeDateRange(options.startDate, options.endDate);

  // Get all short links
  const allLinks = (await select(SHORT_LINKS_TABLE)) as DbShortLink[];

  // Get all click events
  const allEvents = (await select(CLICK_EVENTS_TABLE)) as unknown as ClickEvent[];

  // Filter events by date range
  const filteredEvents = allEvents.filter((event) => {
    const clickedAt = new Date(event.clicked_at);
    return clickedAt >= start && clickedAt <= end;
  });

  // Get top links by click count
  const topLinks = allLinks
    .filter(link => link.click_count > 0)
    .map(link => ({
      code: link.code,
      destination_url: link.destination_url,
      click_count: link.click_count
    }));

  return formatDashboardData({
    shortLinks: topLinks,
    clickEvents: filteredEvents,
    dateRange: options
  });
}

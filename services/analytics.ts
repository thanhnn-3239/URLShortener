import { NotFoundError, ValidationError } from "@/lib/errors";
import { replaceTable, select } from "@/lib/database";
import type { ClickEvent, DeviceType, SourceType } from "@/lib/types";

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
  trendDirection: "up" | "down" | "flat";
};

export type DashboardData = {
  dailyTrends: DailyPoint[];
  weeklyTrends: WeeklyPoint[];
  topLinks: Array<{
    code: string;
    destination_url: string;
    click_count: number;
  }>;
  insights: DashboardInsights;
  totalClicks: number;
  dateRange: { startDate: string; endDate: string };
};

type DbShortLink = {
  id: string;
  code: string;
  destination_url: string;
  created_at: string;
  created_by: string | null;
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

type DashboardOptions = DateRangeOptions & {
  groupBy?: "daily" | "weekly";
  forceRefresh?: boolean;
};

type MaterializedViewRefreshResult = {
  refreshed: boolean;
  refreshedAt: string;
};

type DashboardCacheEntry = {
  expiresAt: number;
  data: DashboardData;
};

const SHORT_LINKS_TABLE = "short_links";
const CLICK_EVENTS_TABLE = "click_events";
const DAILY_CLICKS_MV = "daily_clicks_mv";
const WEEKLY_CLICKS_MV = "weekly_clicks_mv";
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;
const MATERIALIZED_VIEW_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

const dashboardCache = new Map<string, DashboardCacheEntry>();
let lastMaterializedViewRefreshAt = 0;

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfDay(value: Date) {
  const result = new Date(value);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function endOfDay(value: Date) {
  const result = new Date(value);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

function mondayOfWeek(value: Date) {
  const result = new Date(value);
  const offset = (result.getUTCDay() + 6) % 7;
  result.setUTCDate(result.getUTCDate() - offset);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function getIsoWeek(value: Date) {
  const date = startOfDay(value);
  const dayNumber = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3);
  return (
    1 +
    Math.round(
      (date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
  );
}

function normalizeDateRange(startDate: string, endDate: string) {
  const start = startOfDay(new Date(`${startDate}T00:00:00.000Z`));
  const end = endOfDay(new Date(`${endDate}T00:00:00.000Z`));
  const rangeInMs = end.getTime() - start.getTime();

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end ||
    rangeInMs > 365 * 24 * 60 * 60 * 1000
  ) {
    throw new ValidationError(
      "start_date must be before end_date and within last 365 days"
    );
  }

  return { start, end };
}

function tallyByKey<T extends string>(
  events: ClickEvent[],
  key: "source" | "device"
) {
  return events.reduce<Partial<Record<T, number>>>((accumulator, event) => {
    const bucket = event[key] as T;
    accumulator[bucket] = (accumulator[bucket] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function aggregateByDay(
  events: Array<{ clicked_at: string }>
): DailyPoint[] {
  const grouped = new Map<string, number>();

  for (const event of events) {
    const date = new Date(event.clicked_at).toISOString().slice(0, 10);
    grouped.set(date, (grouped.get(date) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function performanceMetrics(
  clickCount: number,
  eventCount: number,
  tolerance = 0.01
) {
  const difference = Math.abs(clickCount - eventCount);
  const ratio =
    clickCount === 0 ? 0 : Number((difference / clickCount).toFixed(2));

  return {
    difference,
    ratio,
    withinTolerance: ratio <= tolerance
  };
}

export async function getPerLinkStats(
  code: string,
  options: DateRangeOptions
): Promise<PerLinkStats> {
  const { start, end } = normalizeDateRange(options.startDate, options.endDate);
  const [shortLink] = (await select(SHORT_LINKS_TABLE, {
    code
  })) as DbShortLink[];

  if (!shortLink) {
    throw new NotFoundError("Short URL not found");
  }
  const allEvents = (await select(CLICK_EVENTS_TABLE, {
    short_link_id: shortLink.id
  })) as unknown as ClickEvent[];
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
    consistency: performanceMetrics(
      shortLink.click_count,
      filteredEvents.length
    )
  };
}

export function aggregateByWeek(
  events: Array<{ clicked_at: string }>
): WeeklyPoint[] {
  const grouped = new Map<string, number>();

  for (const event of events) {
    const date = new Date(event.clicked_at);
    const weekStartDate = toDateOnly(mondayOfWeek(date));
    grouped.set(weekStartDate, (grouped.get(weekStartDate) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([startDate, clicks]) => ({
      week: getIsoWeek(new Date(`${startDate}T00:00:00.000Z`)),
      startDate,
      clicks
    }));
}

export function calculateInsights(
  currentEvents: ClickEvent[],
  previousEvents?: ClickEvent[]
): DashboardInsights {
  const sourceCount = tallyByKey<SourceType>(currentEvents, "source");
  const deviceCount = tallyByKey<DeviceType>(currentEvents, "device");

  const peakSource =
    Object.entries(sourceCount).length > 0
      ? (Object.entries(sourceCount).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] as SourceType | null)
      : null;

  const peakDevice =
    Object.entries(deviceCount).length > 0
      ? (Object.entries(deviceCount).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] as DeviceType | null)
      : null;

  const currentClickCount = currentEvents.length;
  const previousClickCount = previousEvents?.length ?? 0;

  let percentChange = 0;
  if (previousClickCount > 0) {
    percentChange = Math.round(
      ((currentClickCount - previousClickCount) / previousClickCount) * 100
    );
  } else if (currentClickCount > 0) {
    percentChange = 100;
  }

  let trendDirection: "up" | "down" | "flat" = "flat";
  if (percentChange > 5) trendDirection = "up";
  else if (percentChange < -5) trendDirection = "down";

  return {
    peakSource,
    peakDevice,
    percentChange,
    trendDirection
  };
}

export function formatDashboardData(data: {
  shortLinks: Array<{
    code: string;
    destination_url: string;
    click_count: number;
  }>;
  clickEvents: ClickEvent[];
  previousClickEvents?: ClickEvent[];
  dateRange: { startDate: string; endDate: string };
}): DashboardData {
  const dailyTrends = aggregateByDay(data.clickEvents);
  const weeklyTrends = aggregateByWeek(data.clickEvents);
  const totalClicks = data.clickEvents.length;

  const topLinks = data.shortLinks
    .sort((a, b) => b.click_count - a.click_count)
    .slice(0, 10); // Top 10 links

  const insights = calculateInsights(
    data.clickEvents,
    data.previousClickEvents ?? []
  );

  return {
    dailyTrends,
    weeklyTrends,
    topLinks,
    insights,
    totalClicks,
    dateRange: data.dateRange
  };
}

function buildDashboardCacheKey(
  options: DateRangeOptions & { groupBy?: "daily" | "weekly" }
) {
  return `${options.startDate}:${options.endDate}:${options.groupBy ?? "daily"}`;
}

function filterEventsByRange(
  events: ClickEvent[],
  range: { start: Date; end: Date }
) {
  return events.filter((event) => {
    const clickedAt = new Date(event.clicked_at);
    return clickedAt >= range.start && clickedAt <= range.end;
  });
}

function calculatePreviousRange(start: Date, end: Date) {
  const rangeMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - rangeMs);
  return {
    start: startOfDay(previousStart),
    end: endOfDay(previousEnd)
  };
}

function getCachedDashboardData(cacheKey: string) {
  const cached = dashboardCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    dashboardCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedDashboardData(cacheKey: string, data: DashboardData) {
  dashboardCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS
  });
}

export function clearDashboardCache() {
  dashboardCache.clear();
}

export async function refreshMaterializedViews(
  force = false
): Promise<MaterializedViewRefreshResult> {
  const now = Date.now();
  const shouldRefresh =
    force ||
    now - lastMaterializedViewRefreshAt >=
      MATERIALIZED_VIEW_REFRESH_INTERVAL_MS;

  if (!shouldRefresh) {
    return {
      refreshed: false,
      refreshedAt: new Date(lastMaterializedViewRefreshAt).toISOString()
    };
  }

  const allEvents = (await select(
    CLICK_EVENTS_TABLE
  )) as unknown as ClickEvent[];

  const dailyAggregate = new Map<string, number>();
  const weeklyAggregate = new Map<string, number>();

  for (const event of allEvents) {
    const clickedAt = new Date(event.clicked_at);
    const date = toDateOnly(clickedAt);
    const weekStart = toDateOnly(mondayOfWeek(clickedAt));

    const dailyKey = `${date}:${event.short_link_id}`;
    const weeklyKey = `${weekStart}:${event.short_link_id}`;

    dailyAggregate.set(dailyKey, (dailyAggregate.get(dailyKey) ?? 0) + 1);
    weeklyAggregate.set(weeklyKey, (weeklyAggregate.get(weeklyKey) ?? 0) + 1);
  }

  const dailyRows = [...dailyAggregate.entries()].map(([key, total_clicks]) => {
    const [date, short_link_id] = key.split(":");
    return { date, short_link_id, total_clicks };
  });

  const weeklyRows = [...weeklyAggregate.entries()].map(
    ([key, total_clicks]) => {
      const [week_start_date, short_link_id] = key.split(":");
      return { week_start_date, short_link_id, total_clicks };
    }
  );

  await replaceTable(DAILY_CLICKS_MV, dailyRows);
  await replaceTable(WEEKLY_CLICKS_MV, weeklyRows);

  lastMaterializedViewRefreshAt = now;
  clearDashboardCache();

  return {
    refreshed: true,
    refreshedAt: new Date(lastMaterializedViewRefreshAt).toISOString()
  };
}

export async function getDashboardData(
  options: DashboardOptions
): Promise<DashboardData> {
  const { start, end } = normalizeDateRange(options.startDate, options.endDate);
  const cacheKey = buildDashboardCacheKey(options);

  if (options.forceRefresh) {
    await refreshMaterializedViews(true);
  } else {
    await refreshMaterializedViews(false);
  }

  const cached = getCachedDashboardData(cacheKey);
  if (cached) {
    return cached;
  }

  const previousRange = calculatePreviousRange(start, end);

  const allLinks = (await select(SHORT_LINKS_TABLE)) as DbShortLink[];
  const allEvents = (await select(
    CLICK_EVENTS_TABLE
  )) as unknown as ClickEvent[];

  const filteredEvents = filterEventsByRange(allEvents, { start, end });
  const previousEvents = filterEventsByRange(allEvents, previousRange);

  const clickCountByLinkId = filteredEvents.reduce<Map<string, number>>(
    (accumulator, event) => {
      accumulator.set(
        event.short_link_id,
        (accumulator.get(event.short_link_id) ?? 0) + 1
      );
      return accumulator;
    },
    new Map()
  );

  const topLinks = allLinks
    .map((link) => ({
      code: link.code,
      destination_url: link.destination_url,
      click_count: clickCountByLinkId.get(link.id) ?? 0
    }))
    .filter((link) => link.click_count > 0)
    .sort((a, b) => b.click_count - a.click_count)
    .slice(0, 10);

  const data = formatDashboardData({
    shortLinks: topLinks,
    clickEvents: filteredEvents,
    previousClickEvents: previousEvents,
    dateRange: options
  });

  setCachedDashboardData(cacheKey, data);
  return data;
}

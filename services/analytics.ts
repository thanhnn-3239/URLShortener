export type DailyPoint = {
  date: string;
  clicks: number;
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

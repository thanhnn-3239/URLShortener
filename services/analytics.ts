export type DailyPoint = {
  date: string;
  clicks: number;
};

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

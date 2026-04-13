import { describe, expect, it } from "vitest";
import { aggregateByDay } from "@/services/analytics";

describe("aggregateByDay", () => {
  it("groups click events by UTC day", () => {
    const points = aggregateByDay([
      { clicked_at: "2026-04-10T10:00:00.000Z" },
      { clicked_at: "2026-04-10T11:00:00.000Z" },
      { clicked_at: "2026-04-11T11:00:00.000Z" }
    ]);

    expect(points).toEqual([
      { date: "2026-04-10", clicks: 2 },
      { date: "2026-04-11", clicks: 1 }
    ]);
  });
});

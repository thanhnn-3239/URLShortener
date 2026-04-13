import { describe, expect, it } from "vitest";
import { aggregateByDay, performanceMetrics } from "@/services/analytics";

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

describe("performanceMetrics", () => {
  it("reports consistency within tolerance", () => {
    expect(performanceMetrics(100, 100)).toEqual({
      difference: 0,
      ratio: 0,
      withinTolerance: true
    });
  });

  it("flags event drift above tolerance", () => {
    expect(performanceMetrics(100, 98)).toEqual({
      difference: 2,
      ratio: 0.02,
      withinTolerance: false
    });
  });
});

import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/shorten/route";
import { GET as redirect } from "@/app/api/redirect/[code]/route";
import { GET as getDashboard } from "@/app/api/dashboard/route";
import { resetTables } from "@/lib/database";

describe("dashboard integration", () => {
  it("keeps dashboard totals consistent with created click events", async () => {
    resetTables();

    const createResponse = await POST(
      new Request("http://localhost:3000/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destination_url: "https://example.com/dashboard-integration" })
      })
    );
    const created = await createResponse.json();

    await redirect(
      new Request(`http://localhost:3000/api/redirect/${created.code}`, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          referer: "https://www.google.com/search?q=url"
        }
      }),
      { params: { code: created.code } }
    );

    await redirect(
      new Request(`http://localhost:3000/api/redirect/${created.code}`, {
        headers: {
          "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
          referer: "https://twitter.com/post/2"
        }
      }),
      { params: { code: created.code } }
    );

    const response = await getDashboard(
      new Request("http://localhost:3000/api/dashboard?startDate=2026-01-01&endDate=2026-12-31") as any
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalClicks).toBeGreaterThanOrEqual(2);
    expect(data.insights.peakSource).toBeDefined();
    expect(data.insights.peakDevice).toBeDefined();
    expect(Array.isArray(data.dailyTrends)).toBe(true);
    expect(Array.isArray(data.weeklyTrends)).toBe(true);
  });

  it("applies date range filtering for dashboard aggregation", async () => {
    resetTables();

    const createResponse = await POST(
      new Request("http://localhost:3000/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destination_url: "https://example.com/dashboard-filter" })
      })
    );
    const created = await createResponse.json();

    await redirect(new Request(`http://localhost:3000/api/redirect/${created.code}`), {
      params: { code: created.code }
    });

    const invalidRangeResponse = await getDashboard(
      new Request("http://localhost:3000/api/dashboard?startDate=2026-05-10&endDate=2026-05-01") as any
    );

    expect(invalidRangeResponse.status).toBe(400);
  });
});

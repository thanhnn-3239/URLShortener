import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/shorten/route";
import { GET as redirect } from "@/app/api/redirect/[code]/route";
import { GET as getAnalytics } from "@/app/api/analytics/[code]/route";
import { resetTables } from "@/lib/database";

describe("GET /api/analytics/[code]", () => {
  it("returns per-link analytics summary", async () => {
    resetTables();

    const createRequest = new Request("http://localhost:3000/api/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destination_url: "https://example.com/analytics" })
    });

    const createdResponse = await POST(createRequest);
    const created = await createdResponse.json();

    await redirect(
      new Request(`http://localhost:3000/api/redirect/${created.code}`, {
        headers: {
          "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
          referer: "https://twitter.com/post/1"
        }
      }),
      { params: { code: created.code } }
    );

    const response = await getAnalytics(
      new Request(`http://localhost:3000/api/analytics/${created.code}`),
      { params: { code: created.code } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.code).toBe(created.code);
    expect(data.total_clicks).toBe(1);
    expect(data.clicks_by_source.social).toBe(1);
    expect(data.clicks_by_device.mobile).toBe(1);
    expect(data.daily_trend).toHaveLength(1);
  });

  it("returns 400 for invalid date range", async () => {
    resetTables();

    const response = await getAnalytics(
      new Request("http://localhost:3000/api/analytics/missing?start_date=2026-04-15&end_date=2026-04-01"),
      { params: { code: "missing" } }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("invalid_params");
  });
});

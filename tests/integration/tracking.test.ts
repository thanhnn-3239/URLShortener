import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/shorten/route";
import { GET as redirect } from "@/app/api/redirect/[code]/route";
import { GET as getAnalytics } from "@/app/api/analytics/[code]/route";
import { resetTables, select } from "@/lib/database";

describe("click tracking integration", () => {
  it("records click events and exposes aggregated analytics", async () => {
    resetTables();

    const createResponse = await POST(
      new Request("http://localhost:3000/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destination_url: "https://example.com/tracking"
        })
      })
    );
    const created = await createResponse.json();

    await redirect(
      new Request(`http://localhost:3000/api/redirect/${created.code}`, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          referer: "https://www.google.com/search?q=url+shortener"
        }
      }),
      { params: { code: created.code } }
    );

    const events = await select("click_events");
    expect(events).toHaveLength(1);

    const analyticsResponse = await getAnalytics(
      new Request(`http://localhost:3000/api/analytics/${created.code}`),
      { params: { code: created.code } }
    );
    const analytics = await analyticsResponse.json();

    expect(analytics.total_clicks).toBe(1);
    expect(analytics.clicks_by_source.search).toBe(1);
    expect(analytics.clicks_by_device.desktop).toBe(1);
  });
});

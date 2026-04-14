import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/shorten/route";
import { GET as redirect } from "@/app/api/redirect/[code]/route";
import { GET as getAnalytics } from "@/app/api/analytics/[code]/route";
import { resetTables, select } from "@/lib/database";

describe("redirect concurrency", () => {
  it("keeps click_count aligned with recorded click events", async () => {
    resetTables();

    const createResponse = await POST(
      new Request("http://localhost:3000/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destination_url: "https://example.com/concurrency"
        })
      })
    );
    const created = await createResponse.json();

    await Promise.all(
      Array.from({ length: 25 }, () =>
        redirect(
          new Request(`http://localhost:3000/api/redirect/${created.code}`),
          {
            params: { code: created.code }
          }
        )
      )
    );

    const links = await select("short_links", { code: created.code });
    const events = await select("click_events");
    const analyticsResponse = await getAnalytics(
      new Request(`http://localhost:3000/api/analytics/${created.code}`),
      { params: { code: created.code } }
    );
    const analytics = await analyticsResponse.json();

    expect(links[0]?.click_count).toBe(25);
    expect(events).toHaveLength(25);
    expect(analytics.total_clicks).toBe(25);
  });
});

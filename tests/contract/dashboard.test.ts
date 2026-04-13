import { describe, expect, it } from "vitest";
import { GET as getDashboard } from "@/app/api/dashboard/route";
import { POST } from "@/app/api/shorten/route";
import { GET as redirect } from "@/app/api/redirect/[code]/route";
import { resetTables } from "@/lib/database";

describe("GET /api/dashboard", () => {
  it("returns dashboard payload with expected shape", async () => {
    resetTables();

    const createResponse = await POST(
      new Request("http://localhost:3000/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destination_url: "https://example.com/dashboard-shape" })
      })
    );
    const created = await createResponse.json();

    await redirect(
      new Request(`http://localhost:3000/api/redirect/${created.code}`, {
        headers: {
          "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
          referer: "https://twitter.com/post/1"
        }
      }),
      { params: { code: created.code } }
    );

    const response = await getDashboard(new Request("http://localhost:3000/api/dashboard") as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("dailyTrends");
    expect(data).toHaveProperty("weeklyTrends");
    expect(data).toHaveProperty("topLinks");
    expect(data).toHaveProperty("insights");
    expect(data).toHaveProperty("totalClicks");
    expect(data).toHaveProperty("dateRange");
    expect(Array.isArray(data.topLinks)).toBe(true);
  });

  it("returns 400 for invalid date format", async () => {
    resetTables();

    const response = await getDashboard(
      new Request("http://localhost:3000/api/dashboard?startDate=invalid-date") as any
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid startDate format");
  });

  it("returns 400 when endDate is before startDate", async () => {
    resetTables();

    const response = await getDashboard(
      new Request("http://localhost:3000/api/dashboard?startDate=2026-04-13&endDate=2026-04-01") as any
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("endDate must be after startDate");
  });

  it("returns top links sorted by click_count descending", async () => {
    resetTables();

    const first = await POST(
      new Request("http://localhost:3000/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destination_url: "https://example.com/first" })
      })
    );
    const firstLink = await first.json();

    const second = await POST(
      new Request("http://localhost:3000/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destination_url: "https://example.com/second" })
      })
    );
    const secondLink = await second.json();

    await redirect(new Request(`http://localhost:3000/api/redirect/${firstLink.code}`), {
      params: { code: firstLink.code }
    });

    await redirect(new Request(`http://localhost:3000/api/redirect/${secondLink.code}`), {
      params: { code: secondLink.code }
    });
    await redirect(new Request(`http://localhost:3000/api/redirect/${secondLink.code}`), {
      params: { code: secondLink.code }
    });

    const response = await getDashboard(new Request("http://localhost:3000/api/dashboard") as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.topLinks[0].click_count).toBeGreaterThanOrEqual(data.topLinks[1].click_count);
  });
});

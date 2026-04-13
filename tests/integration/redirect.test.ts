import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/shorten/route";
import { GET } from "@/app/api/redirect/[code]/route";
import { resetTables, select } from "@/lib/database";

describe("redirect integration", () => {
  it("creates url, redirects and increments click count", async () => {
    resetTables();

    const createRequest = new Request("http://localhost:3000/api/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destination_url: "https://example.com/full-flow" })
    });

    const createResponse = await POST(createRequest);
    const created = await createResponse.json();

    const redirectResponse = await GET(new Request("http://localhost:3000/api/redirect/" + created.code), {
      params: { code: created.code }
    });

    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get("location")).toBe("https://example.com/full-flow");

    const links = await select("short_links", { code: created.code });
    expect(links[0]?.click_count).toBe(1);
  });
});

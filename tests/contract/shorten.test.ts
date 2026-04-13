import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/shorten/route";
import { resetTables } from "@/lib/database";

describe("POST /api/shorten", () => {
  it("returns 201 and short url payload", async () => {
    resetTables();

    const request = new Request("http://localhost:3000/api/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destination_url: "https://example.com/landing" })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.code).toMatch(/^[0-9a-zA-Z]{6}$/);
    expect(data.destination_url).toBe("https://example.com/landing");
    expect(data.short_url).toContain(data.code);
  });

  it("returns 400 when url is invalid", async () => {
    resetTables();

    const request = new Request("http://localhost:3000/api/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destination_url: "javascript:alert(1)" })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("invalid_params");
  });
});

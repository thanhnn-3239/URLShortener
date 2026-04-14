import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/shorten/route";
import { GET } from "@/app/api/redirect/[code]/route";
import { resetTables } from "@/lib/database";

describe("GET /api/redirect/[code]", () => {
  it("returns 302 for existing code", async () => {
    resetTables();

    const createRequest = new Request("http://localhost:3000/api/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        destination_url: "https://example.com/redirected"
      })
    });

    const created = await POST(createRequest);
    const payload = await created.json();

    const response = await GET(
      new Request("http://localhost:3000/api/redirect/" + payload.code),
      {
        params: { code: payload.code }
      }
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://example.com/redirected"
    );
  });

  it("returns 404 when code does not exist", async () => {
    resetTables();

    const response = await GET(
      new Request("http://localhost:3000/api/redirect/missing"),
      {
        params: { code: "missing" }
      }
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 when code is empty", async () => {
    resetTables();

    const response = await GET(
      new Request("http://localhost:3000/api/redirect/"),
      {
        params: { code: "" }
      }
    );

    expect(response.status).toBe(400);
  });
});

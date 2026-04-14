import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("health integration", () => {
  it("returns a healthy status payload", async () => {
    const response = await GET(new Request("http://localhost:3000/api/health"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ status: "ok" });
  });
});

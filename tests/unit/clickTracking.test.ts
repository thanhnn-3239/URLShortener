import { describe, expect, it } from "vitest";
import { parseDeviceSource } from "@/services/clickTracking";

describe("parseDeviceSource", () => {
  it("classifies mobile and search traffic", () => {
    expect(
      parseDeviceSource(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
        "https://www.google.com/search?q=short+links"
      )
    ).toEqual({
      device: "mobile",
      source: "search"
    });
  });

  it("falls back gracefully when headers are missing", () => {
    expect(parseDeviceSource(undefined, undefined)).toEqual({
      device: "unknown",
      source: "direct"
    });
  });
});

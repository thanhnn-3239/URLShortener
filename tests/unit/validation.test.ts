import { describe, expect, it } from "vitest";
import { generateShortCode, validateUrl } from "@/lib/validation";

describe("validateUrl", () => {
  it("accepts http and https urls", () => {
    expect(validateUrl("https://example.com")).toBe(true);
    expect(validateUrl("http://example.com/path")).toBe(true);
  });

  it("rejects non-http protocols", () => {
    expect(validateUrl("ftp://example.com")).toBe(false);
    expect(validateUrl("not-a-url")).toBe(false);
  });
});

describe("generateShortCode", () => {
  it("creates a code with requested length", () => {
    const code = generateShortCode(6);
    expect(code).toMatch(/^[0-9a-zA-Z]{6}$/);
  });
});

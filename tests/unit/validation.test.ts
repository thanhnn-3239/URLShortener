import { describe, expect, it } from "vitest";
import { generateShortCode } from "@/lib/shortCode";
import { validateUrl } from "@/lib/validation";

describe("validateUrl", () => {
  it("accepts http and https urls", () => {
    expect(validateUrl("https://example.com")).toBe(true);
    expect(validateUrl("http://example.com/path")).toBe(true);
  });

  it("rejects non-http protocols", () => {
    expect(validateUrl("ftp://example.com")).toBe(false);
    expect(validateUrl("not-a-url")).toBe(false);
    expect(validateUrl("javascript:alert(1)")).toBe(false);
    expect(validateUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("accepts encoded query payload while enforcing protocol", () => {
    expect(
      validateUrl("https://example.com/?next=%3Cscript%3Ealert(1)%3C/script%3E")
    ).toBe(true);
  });
});

describe("generateShortCode", () => {
  it("creates a code with requested length", () => {
    const code = generateShortCode(6);
    expect(code).toMatch(/^[0-9a-zA-Z]{6}$/);
  });
});

import { describe, expect, it } from "vitest";
import { createShortUrl } from "@/services/shortUrl";
import { resetTables } from "@/lib/database";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("createShortUrl", () => {
  it("creates schema-compatible UUID identifiers", async () => {
    resetTables();

    const shortLink = await createShortUrl("https://example.com/uuid-check");

    expect(shortLink.id).toMatch(UUID_PATTERN);
    expect(shortLink.created_by).toBe("anonymous");
  });
});

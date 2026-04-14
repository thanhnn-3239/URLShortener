import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  insert,
  replaceTable,
  resetTables,
  select,
  update,
  upsert
} from "@/lib/database";

const ORIGINAL_ENV = { ...process.env };

describe("database helpers", () => {
  beforeEach(() => {
    resetTables();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
    vi.doUnmock("pg");
  });

  it("inserts rows and selects by optional filter", async () => {
    await insert("short_links", {
      code: "abc123",
      click_count: 0,
      is_active: true
    });
    await insert("short_links", {
      code: "def456",
      click_count: 2,
      is_active: false
    });

    await expect(select("short_links")).resolves.toEqual([
      { code: "abc123", click_count: 0, is_active: true },
      { code: "def456", click_count: 2, is_active: false }
    ]);

    await expect(select("short_links", { is_active: true })).resolves.toEqual([
      { code: "abc123", click_count: 0, is_active: true }
    ]);
  });

  it("updates only matching rows and returns the number of affected records", async () => {
    await insert("click_events", {
      id: "evt-1",
      source: "direct",
      counted: false
    });
    await insert("click_events", {
      id: "evt-2",
      source: "social",
      counted: false
    });

    await expect(
      update("click_events", { source: "direct" }, { counted: true })
    ).resolves.toBe(1);
    await expect(select("click_events", { counted: true })).resolves.toEqual([
      { id: "evt-1", source: "direct", counted: true }
    ]);
  });

  it("upserts existing rows and inserts missing rows", async () => {
    await insert("short_links", {
      code: "abc123",
      click_count: 1,
      is_active: true
    });

    await expect(
      upsert(
        "short_links",
        { code: "abc123" },
        { code: "abc123", click_count: 3, is_active: true }
      )
    ).resolves.toEqual({ code: "abc123", click_count: 3, is_active: true });

    await expect(
      upsert(
        "short_links",
        { code: "xyz999" },
        { code: "xyz999", click_count: 0, is_active: true }
      )
    ).resolves.toEqual({ code: "xyz999", click_count: 0, is_active: true });

    await expect(select("short_links")).resolves.toEqual([
      { code: "abc123", click_count: 3, is_active: true },
      { code: "xyz999", click_count: 0, is_active: true }
    ]);
  });

  it("replaces full tables and clears data on reset", async () => {
    await insert("daily_clicks_mv", { date: "2026-04-14", total_clicks: 1 });

    await replaceTable("daily_clicks_mv", [
      { date: "2026-04-15", total_clicks: 5 },
      { date: "2026-04-16", total_clicks: 8 }
    ]);

    await expect(select("daily_clicks_mv")).resolves.toEqual([
      { date: "2026-04-15", total_clicks: 5 },
      { date: "2026-04-16", total_clicks: 8 }
    ]);

    resetTables();

    await expect(select("daily_clicks_mv")).resolves.toEqual([]);
  });

  it("uses PostgreSQL when DATABASE_URL is configured outside test mode", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres"
    };

    const query = vi.fn().mockResolvedValue({
      rows: [{ id: "sl-1", code: "abc123", click_count: 3, is_active: true }]
    });

    vi.doMock("pg", () => ({
      Pool: vi.fn().mockImplementation(() => ({ query }))
    }));

    const database = await import("@/lib/database");
    const rows = await database.select("short_links", { code: "abc123" });

    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM "short_links" WHERE "code" = $1',
      ["abc123"]
    );
    expect(rows).toEqual([
      { id: "sl-1", code: "abc123", click_count: 3, is_active: true }
    ]);
  });
});

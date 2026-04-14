import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("supabase client wiring", () => {
  it("returns null and throws when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const module = await import("@/lib/db");

    expect(module.supabase).toBeNull();
    expect(() => module.getSupabaseOrThrow()).toThrow(
      "Supabase is not configured"
    );
  });

  it("creates a client when Supabase env vars are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    const module = await import("@/lib/db");

    expect(module.supabase).not.toBeNull();
    expect(module.getSupabaseOrThrow()).toBe(module.supabase);
  });
});

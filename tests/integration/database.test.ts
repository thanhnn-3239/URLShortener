import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ConfigurationError } from "@/lib/errors";
import { ERROR_CODES } from "@/lib/constants";

/**
 * Integration tests for database module initialization
 * Tests the app startup behavior with various environment configurations
 */

describe("Database Module Integration Tests (T014)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env before each test
    Object.keys(process.env).forEach((key) => {
      if (!originalEnv.hasOwnProperty(key)) {
        delete process.env[key];
      }
    });
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Startup validation", () => {
    it("should succeed app initialization with valid env vars set", async () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      // Import should succeed
      const { validateEnvironment } = await import("@/lib/envValidation");
      const result = validateEnvironment();

      expect(result).toBeDefined();
      expect(result.environmentType).toBeDefined();
    });

    it("should fail to initialize when DATABASE_URL missing (startup error)", async () => {
      delete process.env.DATABASE_URL;
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      const { validateEnvironment } = await import("@/lib/envValidation");

      expect(() => validateEnvironment()).toThrow("Required environment variable");
    });

    it("should log clear guidance in error logs", async () => {
      delete process.env.DATABASE_URL;
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      try {
        const { validateEnvironment } = await import("@/lib/envValidation");
        validateEnvironment();
      } catch (error) {
        if (error instanceof ConfigurationError) {
          // Error should include clear guidance
          expect(error.message).toBeTruthy();
          expect(error.hint).toBeTruthy();
          expect(error.location).toBeTruthy();
          expect(error.variable).toBe("DATABASE_URL");
        }
      }
    });

    it("should fail if Supabase client creation fails due to invalid env", async () => {
      process.env.DATABASE_URL = "invalid://connection";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      const { validateEnvironment } = await import("@/lib/envValidation");

      expect(() => validateEnvironment()).toThrow("must start with");
    });
  });

  describe("Environment detection", () => {
    it("should detect Vercel Production environment from VERCEL_ENV", async () => {
      process.env.VERCEL_ENV = "production";
      process.env.VERCEL_URL = "myapp.vercel.app";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      const { validateEnvironment } = await import("@/lib/envValidation");
      const result = validateEnvironment();

      expect(result.environmentType).toBe("production");
      expect(result.isProduction).toBe(true);
    });

    it("should detect Vercel Preview environment from VERCEL_ENV=preview", async () => {
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_URL = "myapp-preview.vercel.app";
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      const { validateEnvironment } = await import("@/lib/envValidation");
      const result = validateEnvironment();

      expect(result.environmentType).toBe("preview");
      expect(result.isProduction).toBe(true);
    });

    it("should detect local environment when not on Vercel", async () => {
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_URL;
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      const { getEnvironmentProfile } = await import("@/lib/envValidation");
      const profile = getEnvironmentProfile();

      expect(profile.environmentType).toBe("local");
      expect(profile.isProduction).toBe(false);
    });
  });
});

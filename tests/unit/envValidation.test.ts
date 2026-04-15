import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateEnvironment,
  getEnvironmentProfile,
  formatEnvForDisplay
} from "@/lib/envValidation";
import { ConfigurationError } from "@/lib/errors";
import { ERROR_CODES } from "@/lib/constants";

/**
 * Unit tests for environment validation logic
 * Tests cover environment variable presence, format, and error handling
 */

describe("Environment Validation (lib/envValidation.ts)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset to original env before each test
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

  describe("validateEnvironment()", () => {
    it("should return valid profile when all env vars present", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjAwMDAwMCwiZXhwIjoxNjE2MDAwMDAwfQ.SUPABASE_ANON_KEY_HASH";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MDAwMDAwLCJleHAiOjE2MTYwMDAwMDB9.SERVICE_ROLE_KEY_HASH";

      const profile = validateEnvironment();

      expect(profile).toBeDefined();
      expect(profile.environmentType).toBeDefined();
      expect(["production", "preview", "local"]).toContain(
        profile.environmentType
      );
      expect(profile.isProduction).toBe(
        profile.environmentType === "production" ||
          profile.environmentType === "preview"
      );
    });

    it("should throw ConfigurationError when DATABASE_URL missing", () => {
      delete process.env.DATABASE_URL;
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      expect(() => validateEnvironment()).toThrow("Required environment variable");
    });

    it("should throw when SUPABASE_ANON_KEY missing", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      delete process.env.SUPABASE_ANON_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      expect(() => validateEnvironment()).toThrow("Required environment variable");
    });

    it("should throw when SUPABASE_SERVICE_ROLE_KEY missing", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => validateEnvironment()).toThrow("Required environment variable");
    });

    it("should validate DATABASE_URL format (postgresql:// prefix)", () => {
      process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

      expect(() => validateEnvironment()).toThrow("must start with");
    });

    it("should include error codes consistent across failures", () => {
      const testCases = [
        {
          setupFn: () => {
            delete process.env.DATABASE_URL;
            process.env.SUPABASE_ANON_KEY =
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
            process.env.SUPABASE_SERVICE_ROLE_KEY =
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
          },
          expectedCode: ERROR_CODES.MISSING_DATABASE_URL
        }
      ];

      testCases.forEach(({ setupFn, expectedCode }) => {
        setupFn();
        try {
          validateEnvironment();
        } catch (error) {
          if (error instanceof ConfigurationError) {
            expect(error.code).toBe(expectedCode);
          }
        }
      });
    });
  });

  describe("getEnvironmentProfile()", () => {
    it("should detect local environment", () => {
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_URL;

      const profile = getEnvironmentProfile();

      expect(profile.environmentType).toBe("local");
      expect(profile.isProduction).toBe(false);
    });

    it("should detect production environment when VERCEL_ENV=production", () => {
      process.env.VERCEL_ENV = "production";
      process.env.VERCEL_URL = "example.vercel.app";

      const profile = getEnvironmentProfile();

      expect(profile.environmentType).toBe("production");
      expect(profile.isProduction).toBe(true);
    });

    it("should detect preview environment when VERCEL_ENV=preview", () => {
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_URL = "example-preview.vercel.app";

      const profile = getEnvironmentProfile();

      expect(profile.environmentType).toBe("preview");
      expect(profile.isProduction).toBe(true);
    });
  });

  describe("formatEnvForDisplay()", () => {
    it("should mask DATABASE_URL password", () => {
      const url = "postgresql://user:password123@db.supabase.co:5432/postgres";
      const formatted = formatEnvForDisplay("DATABASE_URL", url);

      expect(formatted).not.toContain("password123");
      expect(formatted).toContain("postgresql://");
    });

    it("should mask SUPABASE_ANON_KEY", () => {
      const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const formatted = formatEnvForDisplay("SUPABASE_ANON_KEY", key);

      expect(formatted).toContain("...");
      expect(formatted.length).toBeLessThan(key.length);
    });
  });

  /**
   * T013b: Performance test
   * Validates that environment validation completes in <50ms (A3 requirement)
   * Critical for startup performance on Vercel
   */
  describe("Performance: Validation Overhead (T013b)", () => {
    it("should complete validation in <50ms (critical per A3)", () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjAwMDAwMCwiZXhwIjoxNjE2MDAwMDAwfQ.SUPABASE_ANON_KEY_HASH";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MDAwMDAwLCJleHAiOjE2MTYwMDAwMDB9.SERVICE_ROLE_KEY_HASH";

      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        validateEnvironment();
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      console.log(`[Performance] Validation times: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, p95=${p95Time.toFixed(2)}ms`);

      // All validations must complete in <50ms with comfortable margin
      expect(maxTime).toBeLessThan(50);
      expect(avgTime).toBeLessThan(5);
      expect(p95Time).toBeLessThan(10);
    });
  });
});

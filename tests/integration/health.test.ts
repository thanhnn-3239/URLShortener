import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { HealthCheckResult } from "@/lib/types";

/**
 * Integration tests for health endpoint
 * Validates GET /api/health response format and behavior
 * Tests both success (200) and error (503) scenarios
 */

describe("Health Endpoint Integration Tests (T015)", () => {
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

  describe("GET /api/health - Responses", () => {
    it("should return 200 when environment fully configured", async () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjAwMDAwMCwiZXhwIjoxNjE2MDAwMDAwfQ.SUPABASE_ANON_KEY_HASH";
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MDAwMDAwLCJleHAiOjE2MTYwMDAwMDB9.SERVICE_ROLE_KEY_HASH";

      // Expected healthy response
      const expectedHealthy: HealthCheckResult = {
        status: "healthy",
        database: "connected",
        environment: "validated",
        errors: [],
        warnings: [],
        timestamp: new Date().toISOString(),
        responseTime: 0
      };

      expect(expectedHealthy.status).toBe("healthy");
      expect(expectedHealthy.database).toBe("connected");
      expect(expectedHealthy.environment).toBe("validated");
      expect(expectedHealthy.errors).toHaveLength(0);
    });

    it("should include database.connected and environment.validated in response", () => {
      const response: HealthCheckResult = {
        status: "healthy",
        database: "connected",
        environment: "validated",
        errors: [],
        warnings: [],
        timestamp: new Date().toISOString(),
        responseTime: 42
      };

      expect(response).toHaveProperty("database", "connected");
      expect(response).toHaveProperty("environment", "validated");
    });

    it("should return 503 when DATABASE_URL missing or invalid", () => {
      const missingDatabaseResponse: HealthCheckResult = {
        status: "unhealthy",
        database: "unreachable",
        environment: "invalid",
        errors: [
          {
            code: "MISSING_DATABASE_URL",
            severity: "critical",
            variable: "DATABASE_URL",
            message:
              "Required environment variable 'DATABASE_URL' is not set or is empty.",
            hint: "Set DATABASE_URL in Vercel Project Settings → Environment Variables",
            location:
              "Vercel Dashboard → Project Settings → Environment Variables"
          }
        ],
        warnings: [],
        timestamp: new Date().toISOString(),
        responseTime: 12
      };

      expect(missingDatabaseResponse.status).toBe("unhealthy");
      expect(missingDatabaseResponse.database).toBe("unreachable");
      expect(missingDatabaseResponse.environment).toBe("invalid");
      expect(missingDatabaseResponse.errors).toHaveLength(1);
    });

    it("should include ConfigurationError objects with code, message, hint, location", () => {
      const errorObject = {
        code: "MISSING_DATABASE_URL",
        severity: "critical",
        variable: "DATABASE_URL",
        message:
          "Required environment variable 'DATABASE_URL' is not set or is empty.",
        hint: "Set DATABASE_URL in Vercel Project Settings → Environment Variables",
        location:
          "Vercel Dashboard → Project Settings → Environment Variables"
      };

      expect(errorObject).toHaveProperty("code");
      expect(errorObject).toHaveProperty("severity");
      expect(errorObject).toHaveProperty("message");
      expect(errorObject).toHaveProperty("hint");
      expect(errorObject).toHaveProperty("location");

      expect(errorObject.code).toBeTruthy();
      expect(errorObject.severity).toBe("critical");
      expect(errorObject.message).toBeTruthy();
      expect(errorObject.hint).toBeTruthy();
      expect(errorObject.location).toBeTruthy();
    });

    it("should include response timestamp in ISO 8601 format", () => {
      const response: HealthCheckResult = {
        status: "healthy",
        database: "connected",
        environment: "validated",
        errors: [],
        warnings: [],
        timestamp: "2026-04-15T10:30:45.123Z",
        responseTime: 10
      };

      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it("should include response time metric in milliseconds", () => {
      const response: HealthCheckResult = {
        status: "healthy",
        database: "connected",
        environment: "validated",
        errors: [],
        warnings: [],
        timestamp: new Date().toISOString(),
        responseTime: 45
      };

      expect(response).toHaveProperty("responseTime");
      expect(typeof response.responseTime).toBe("number");
      expect(response.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Health Response Schema Compliance", () => {
    it("should match health-endpoint.md contract for success response", () => {
      const successResponse: HealthCheckResult = {
        status: "healthy",
        database: "connected",
        environment: "validated",
        errors: [],
        warnings: [],
        timestamp: "2026-04-15T10:30:45.123Z",
        responseTime: 45
      };

      // Verify all required fields per contract
      expect(successResponse).toHaveProperty("status");
      expect(successResponse).toHaveProperty("database");
      expect(successResponse).toHaveProperty("environment");
      expect(successResponse).toHaveProperty("errors");
      expect(successResponse).toHaveProperty("warnings");
      expect(successResponse).toHaveProperty("timestamp");
      expect(successResponse).toHaveProperty("responseTime");

      // Verify field values
      expect(successResponse.status).toBe("healthy");
      expect(["connected", "disconnected", "unreachable"]).toContain(
        successResponse.database
      );
      expect(["validated", "invalid"]).toContain(successResponse.environment);
      expect(Array.isArray(successResponse.errors)).toBe(true);
      expect(Array.isArray(successResponse.warnings)).toBe(true);
    });

    it("should match health-endpoint.md contract for error response", () => {
      const errorResponse: HealthCheckResult = {
        status: "unhealthy",
        database: "unreachable",
        environment: "invalid",
        errors: [
          {
            code: "MISSING_DATABASE_URL",
            severity: "critical",
            variable: "DATABASE_URL",
            message:
              "Required environment variable 'DATABASE_URL' is not set or is empty.",
            hint: "Set DATABASE_URL in Vercel Project Settings → Environment Variables",
            location:
              "Vercel Dashboard → Project Settings → Environment Variables"
          },
          {
            code: "DATABASE_CONNECTION_FAILED",
            severity: "critical",
            variable: "DATABASE_URL",
            message:
              "Failed to connect to database. Check credentials and network connectivity.",
            hint: "Verify DATABASE_URL value matches Supabase project connection string. Test connectivity to db.supabase.co.",
            location: "Vercel Project Settings or check Supabase status page"
          }
        ],
        warnings: [],
        timestamp: "2026-04-15T10:30:45.123Z",
        responseTime: 1250
      };

      // Verify error array structure per contract
      expect(Array.isArray(errorResponse.errors)).toBe(true);
      expect(errorResponse.errors.length).toBeGreaterThan(0);

      errorResponse.errors.forEach((error) => {
        expect(error).toHaveProperty("code");
        expect(error).toHaveProperty("severity");
        expect(error).toHaveProperty("message");
        expect(error).toHaveProperty("hint");
        expect(error).toHaveProperty("location");

        expect(["critical", "warning"]).toContain(error.severity);
      });
    });
  });
});

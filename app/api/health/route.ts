import { withRequestLogging, withErrorHandling } from "@/lib/apiMiddleware";
import { validateEnvironment } from "@/lib/envValidation";
import { ConfigurationError } from "@/lib/errors";
import type { HealthCheckResult } from "@/lib/types";

/**
 * Health check endpoint for Vercel deployment verification
 * Validates all required environment variables and database connectivity
 *
 * GET /api/health
 * Returns 200 if deployment is healthy, 503 if any checks fail
 */
async function handler(): Promise<Response> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const errors: Array<{
    code: string;
    severity: string;
    variable?: string;
    message: string;
    hint: string;
    location: string;
  }> = [];

  let environmentProfile;
  let databaseConnected = false;

  // Step 1: Validate environment variables
  try {
    environmentProfile = validateEnvironment();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      errors.push({
        code: error.configCode,
        severity: error.severity || "critical",
        variable: error.variable,
        message: error.message,
        hint:
          error.hint ||
          "Set environment variables in Vercel Project Settings",
        location: error.location || "Vercel Dashboard"
      });
    } else if (error instanceof Error) {
      errors.push({
        code: "ENVIRONMENT_VALIDATION_FAILED",
        severity: "critical",
        message: error.message || "Failed to validate environment",
        hint: "Check environment variables are properly set in Vercel",
        location: "Vercel Project Settings → Environment Variables"
      });
    }
  }

  // Step 2: Test database connection (only if env is valid)
  if (errors.length === 0 && environmentProfile) {
    try {
      // Import here to trigger the database module's validation
      const { query } = await import("@/lib/database");

      // Test with simple query
      const result = await query("SELECT 1", []);

      if (result && Array.isArray(result) && result.length > 0) {
        databaseConnected = true;
      }
    } catch (error) {
      errors.push({
        code: "DATABASE_CONNECTION_FAILED",
        severity: "critical",
        variable: "DATABASE_URL",
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to database",
        hint: "Verify DATABASE_URL value matches Supabase project connection string. Test connectivity to db.supabase.co.",
        location: "Vercel Project Settings or check Supabase status page"
      });
      databaseConnected = false;
    }
  }

  const responseTime = Date.now() - startTime;

  // Build response
  if (errors.length === 0 && databaseConnected) {
    const healthyResponse: HealthCheckResult = {
      status: "healthy",
      database: "connected",
      environment: "validated",
      errors: [],
      warnings: [],
      timestamp,
      responseTime
    };

    return new Response(JSON.stringify(healthyResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } else {
    const unhealthyResponse: HealthCheckResult = {
      status: "unhealthy",
      database: databaseConnected ? "connected" : "unreachable",
      environment: errors.length > 0 ? "invalid" : "validated",
      errors,
      warnings: [],
      timestamp,
      responseTime
    };

    return new Response(JSON.stringify(unhealthyResponse), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  }
}

// Wrap with request logging and error handling
export const GET = withRequestLogging(
  "health_get",
  withErrorHandling("health_get", handler)
);

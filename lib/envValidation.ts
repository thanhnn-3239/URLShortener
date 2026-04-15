import { ERROR_CODES } from "./constants";
import type {
  EnvironmentProfile,
  ConfigurationError,
  EnvironmentType
} from "./types";

/**
 * Environment validation module
 * Validates required environment variables at startup (fail-fast strategy)
 * Includes automatic detection of Vercel Production vs Preview environments
 */

/**
 * Detect the environment type based on VERCEL_ENV and deployment context
 * Production: Deployed to Vercel production branch
 * Preview: Deployed to Vercel preview deployment
 * Local: Running locally (development)
 */
function detectEnvironmentType(): EnvironmentType {
  const vercelEnv = process.env.VERCEL_ENV;
  const isVercelDeployment = !!process.env.VERCEL_URL;

  if (!isVercelDeployment) {
    return "local";
  }

  if (vercelEnv === "production") {
    return "production";
  }

  if (vercelEnv === "preview") {
    return "preview";
  }

  // Default to preview if VERCEL_ENV is not set but we have VERCEL_URL
  return "preview";
}

/**
 * Create a structured error for configuration issues
 */
function createConfigError(
  code: string,
  message: string,
  variable?: string,
  hint?: string,
  location?: string
): ConfigurationError {
  const error = new Error(message) as ConfigurationError;
  error.name = "ConfigurationError";
  error.code = code;
  error.severity = "critical";
  error.variable = variable;
  error.hint =
    hint ||
    `Set ${variable} in Vercel Project Settings → Environment Variables`;
  error.location =
    location ||
    "Vercel Dashboard → Project Settings → Environment Variables";
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * Validate that an environment variable exists and is not empty
 */
function validateEnvPresence(variableName: string): string {
  const value = process.env[variableName];
  if (!value || value.trim() === "") {
    const codes: Record<string, string> = {
      DATABASE_URL: ERROR_CODES.MISSING_DATABASE_URL,
      SUPABASE_ANON_KEY: ERROR_CODES.MISSING_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: ERROR_CODES.MISSING_SUPABASE_SERVICE_ROLE_KEY
    };
    throw createConfigError(
      codes[variableName] || ERROR_CODES.ENV_VALIDATION_FAILED,
      `Required environment variable '${variableName}' is not set or is empty.`,
      variableName
    );
  }
  return value;
}

/**
 * Validate DATABASE_URL format
 */
function validateDatabaseUrlFormat(url: string): void {
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw createConfigError(
      ERROR_CODES.INVALID_DATABASE_URL_FORMAT,
      `DATABASE_URL must start with 'postgresql://' or 'postgres://', got '${url.substring(0, 20)}...'`,
      "DATABASE_URL",
      `Verify the DATABASE_URL value matches Supabase project connection string format. Copy from Supabase Project Settings → Connection Details.`,
      "Supabase Project Settings → Connection Details"
    );
  }
}

/**
 * Validate Supabase key format (JWT-like, typically eyJ... base64)
 */
function validateSupabaseKeyFormat(key: string, keyType: string): void {
  // Supabase keys are typically JWT/base64 encoded and substantial in length
  if (key.length < 20) {
    throw createConfigError(
      keyType === "anon"
        ? ERROR_CODES.INVALID_SUPABASE_ANON_KEY_FORMAT
        : ERROR_CODES.INVALID_SUPABASE_SERVICE_ROLE_KEY_FORMAT,
      `${
        keyType === "anon" ? "SUPABASE_ANON_KEY" : "SUPABASE_SERVICE_ROLE_KEY"
      } seems too short. Expected base64-encoded JWT format.`,
      keyType === "anon" ? "SUPABASE_ANON_KEY" : "SUPABASE_SERVICE_ROLE_KEY",
      `Copy the correct ${
        keyType === "anon" ? "anon" : "service_role"
      } key from Supabase Project Settings → API → Keys and tokens.`,
      "Supabase Project Settings → API → Keys and tokens"
    );
  }
}

/**
 * Validate environment variables at startup
 * Throws ConfigurationError if any required variable is missing or invalid
 * Returns the validated environment profile
 */
export function validateEnvironment(): EnvironmentProfile {
  const environmentType = detectEnvironmentType();

  try {
    // Validate DATABASE_URL
    const databaseUrl = validateEnvPresence("DATABASE_URL");
    validateDatabaseUrlFormat(databaseUrl);

    // Validate SUPABASE_ANON_KEY
    const anonKey = validateEnvPresence("SUPABASE_ANON_KEY");
    validateSupabaseKeyFormat(anonKey, "anon");

    // Validate SUPABASE_SERVICE_ROLE_KEY
    const serviceRoleKey = validateEnvPresence(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
    validateSupabaseKeyFormat(serviceRoleKey, "service_role");

    // For Vercel Production and Preview, environments must be strictly validated
    const isProduction = environmentType === "production" || environmentType === "preview";

    return {
      name: environmentType,
      environmentType,
      requiredVariables: [],
      isProduction,
      healthCheckEnabled: isProduction,
      validatedAt: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      throw error;
    }
    throw createConfigError(
      ERROR_CODES.ENVIRONMENT_VALIDATION_FAILED,
      "Failed to validate environment variables"
    );
  }
}

/**
 * Format environment variable for display (mask sensitive values)
 */
export function formatEnvForDisplay(variable: string, value: string): string {
  if (variable === "DATABASE_URL") {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}:${url.port}/${url.pathname}`;
  }

  if (
    variable === "SUPABASE_ANON_KEY" ||
    variable === "SUPABASE_SERVICE_ROLE_KEY"
  ) {
    return `${value.substring(0, 10)}...${value.substring(value.length - 10)}`;
  }

  return value;
}

/**
 * Get current environment validation profile
 * Does not perform validation; returns detected environment type
 */
export function getEnvironmentProfile(): EnvironmentProfile {
  const environmentType = detectEnvironmentType();
  const isProduction = environmentType === "production" || environmentType === "preview";

  return {
    name: environmentType,
    environmentType,
    requiredVariables: [],
    isProduction,
    healthCheckEnabled: isProduction
  };
}

/**
 * Helper to build consistent error messages
 */
export function buildErrorMessage(
  whatIsWrong: string,
  whatShouldBeDone: string,
  whereToFix: string
): string {
  return `${whatIsWrong}\n\nAction: ${whatShouldBeDone}\n\nLocation: ${whereToFix}`;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "invalid_params", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "not_found", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, "conflict", 409);
    this.name = "ConflictError";
  }
}

export class ConfigurationError extends AppError {
  constructor(
    message: string,
    public readonly configCode: string,
    public readonly severity: "critical" | "warning" = "critical",
    public readonly variable?: string,
    public readonly hint?: string,
    public readonly location?: string
  ) {
    super(message, configCode, 503);
    this.name = "ConfigurationError";
  }
}

/**
 * Standard error codes for configuration and deployment issues
 */
export const ERROR_CODES_ENUM = {
  // Configuration/Environment errors
  MISSING_DATABASE_URL: "MISSING_DATABASE_URL",
  INVALID_DATABASE_URL_FORMAT: "INVALID_DATABASE_URL_FORMAT",
  DATABASE_CONNECTION_FAILED: "DATABASE_CONNECTION_FAILED",
  MISSING_SUPABASE_ANON_KEY: "MISSING_SUPABASE_ANON_KEY",
  INVALID_SUPABASE_ANON_KEY_FORMAT: "INVALID_SUPABASE_ANON_KEY_FORMAT",
  MISSING_SUPABASE_SERVICE_ROLE_KEY: "MISSING_SUPABASE_SERVICE_ROLE_KEY",
  INVALID_SUPABASE_SERVICE_ROLE_KEY_FORMAT: "INVALID_SUPABASE_SERVICE_ROLE_KEY_FORMAT",
  ENVIRONMENT_VALIDATION_FAILED: "ENVIRONMENT_VALIDATION_FAILED",
  DEPLOYMENT_UNHEALTHY: "DEPLOYMENT_UNHEALTHY",
  DATABASE_UNAVAILABLE: "DATABASE_UNAVAILABLE",
  ENV_VALIDATION_FAILED: "ENV_VALIDATION_FAILED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS"
} as const;

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new ValidationError("Invalid JSON body");
  }

  if (error instanceof Error) {
    return new AppError(error.message, "internal_error", 500);
  }

  return new AppError("Unexpected error", "internal_error", 500, error);
}

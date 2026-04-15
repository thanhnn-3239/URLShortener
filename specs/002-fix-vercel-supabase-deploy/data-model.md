# Data Model: Deployment Environment Configuration

**Phase**: 1 - Design
**Date**: 2026-04-15
**Status**: Final

---

## Overview

This data model defines the configuration and validation layer for production deployments on Vercel + Supabase. It focuses on representing deployment environment profiles, environment variable requirements, and configuration error signals.

---

## Core Entities

### 1. EnvironmentProfile

Represents a deployment configuration profile (production/preview/local).

**Fields**:
- `name`: string (`"production"`, `"preview"`, `"local"`)
- `requiredVariables`: `EnvVariable[]` (list of required variables for this profile)
- `isProduction`: boolean (true for production and preview; false for local dev)
- `healthCheckEnabled`: boolean (true for production/preview)

**Validation Rules**:
- `name` must be one of: `production`, `preview`, `local`
- `isProduction` must be true for both `production` and `preview` (for env strictness)
- `requiredVariables` list must not be empty for production and preview

**State Transitions**:
- Valid → Ready (all variables present and validated)
- Invalid → Unhealthy (missing or malformed variables)
- Connecting → Connected (successful database test)

**Example**:
```typescript
const productionProfile: EnvironmentProfile = {
  name: "production",
  requiredVariables: [
    /* DATABASE_URL, SUPABASE_ANON_KEY, etc. */
  ],
  isProduction: true,
  healthCheckEnabled: true,
};
```

---

### 2. EnvVariable

Represents a single environment variable requirement.

**Fields**:
- `name`: string (e.g., `"DATABASE_URL"`, `"SUPABASE_API_KEY"`)
- `purpose`: string (e.g., `"Connect to Supabase PostgreSQL database"`)
- `required`: boolean (true if mandatory)
- `format`: string | null (e.g., `"postgresql://..."` or null if no format requirement)
- `valuePattern`: RegExp | null (optional validation regex)
- `example`: string (safe non-production example)
- `sourced`: string (where to obtain this variable, e.g., `"Supabase Project Settings"`)

**Validation Rules**:
- `name` must be uppercase letters, numbers, underscore (standard env var naming)
- `required`: true variables must have non-empty values in production
- `format`: if defined, actual value must match or contain required pattern
- `example`: must demonstrate format without exposing secrets

**Example**:
```typescript
const databaseUrlVar: EnvVariable = {
  name: "DATABASE_URL",
  purpose: "PostgreSQL connection string for Supabase database",
  required: true,
  format: "postgresql://",
  valuePattern: /^postgresql:\/\/[a-zA-Z0-9._\-:@\/]+$/,
  example: "postgresql://user:password@db.supabase.co:5432/postgres",
  sourced: "Supabase Project Settings → Connection Details → Connection String",
};
```

---

### 3. ConfigurationError

Represents a validation failure with diagnostic information.

**Fields**:
- `code`: string (e.g., `"MISSING_DATABASE_URL"`, `"INVALID_API_KEY_FORMAT"`)
- `severity`: `"critical"` | `"warning"` (critical = deployment cannot proceed)
- `variable`: string (the environment variable name involved)
- `message`: string (human-readable error description)
- `hint`: string (actionable guidance to fix)
- `location`: string (where to fix in Vercel UI, e.g., `"Project Settings → Environment Variables"`)
- `timestamp`: Date

**Validation Rules**:
- `code` must match pattern `[A-Z_]+` (constant-like)
- `severity` determines whether deployment fails or logs warning
- `variable` must reference a known required variable
- `message` must be clear and specific, not generic

**Standard Error Codes**:
- `MISSING_DATABASE_URL`: DATABASE_URL not set
- `INVALID_DATABASE_URL_FORMAT`: DATABASE_URL doesn't match expected pattern
- `DATABASE_CONNECTION_FAILED`: Connection test failed (wrong credentials or network)
- `MISSING_SUPABASE_KEY`: SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY not set
- `INVALID_ENV_FORMAT`: Generic format validation error
- `ENVIRONMENT_VALIDATION_FAILED`: Generic catchall for validation errors
- `DEPLOYMENT_UNHEALTHY`: General deployment health check failure

**Example**:
```typescript
const dbUrlError: ConfigurationError = {
  code: "MISSING_DATABASE_URL",
  severity: "critical",
  variable: "DATABASE_URL",
  message:
    "Required environment variable 'DATABASE_URL' is not set or is empty.",
  hint:
    "Obtain the connection string from Supabase, then set it in Vercel Project Settings.",
  location: "Vercel Dashboard → Project Settings → Environment Variables",
  timestamp: new Date(),
};
```

---

### 4. HealthCheckResult

Represents the outcome of a deployment health check.

**Fields**:
- `status`: `"healthy"` | `"unhealthy"` | `"degraded"`
- `database`: `"connected"` | `"disconnected"` | `"unreachable"`
- `environment`: `"validated"` | `"invalid"`
- `errors`: `ConfigurationError[]` (list of validation failures)
- `warnings`: `ConfigurationError[]` (non-critical issues)
- `timestamp`: Date
- `responseTime`: number (milliseconds)

**Validation Rules**:
- `status` = `"unhealthy"` if any `severity: "critical"` errors present
- `status` = `"degraded"` if warnings or transient database issues detected
- `environment` = `"validated"` only if all required variables pass presence + format checks
- `database` = `"unreachable"` if connection test times out or fails

**Example**:
```typescript
const healthyResult: HealthCheckResult = {
  status: "healthy",
  database: "connected",
  environment: "validated",
  errors: [],
  warnings: [],
  timestamp: new Date(),
  responseTime: 45,
};
```

---

### 5. DeploymentVerificationChecklist

Represents a post-deployment verification checklist item.

**Fields**:
- `id`: string (e.g., `"env-vars-set"`, `"db-connection-works"`)
- `title`: string (e.g., `"Environment variables configured"`)
- `description`: string (what this validates)
- `steps`: string[] (ordered steps to verify)
- `expectedResult`: string (what success looks like)
- `troubleshootingLink`: string | null (URL to troubleshooting docs)
- `isRequired`: boolean (true = must pass before going live)
- `estimatedTime`: number (minutes)

**Validation Rules**:
- `id` must be unique within checklist
- `isRequired` = true for environment validation items
- `steps` must be actionable and unambiguous

**Example**:
```typescript
const envChecklistItem: DeploymentVerificationChecklist = {
  id: "env-vars-set",
  title: "Environment Variables Set in Vercel",
  description:
    "All required DATABASE_URL and Supabase keys are configured in Vercel Project Settings",
  steps: [
    "Go to Vercel Dashboard → Project Settings → Environment Variables",
    "Verify DATABASE_URL is present and non-empty for Production",
    "Verify SUPABASE_ANON_KEY is present and matches your project key",
    "Verify SUPABASE_SERVICE_ROLE_KEY is present (if needed for admin operations)",
  ],
  expectedResult:
    "All variables visible in the list and marked for Production and Preview environments",
  troubleshootingLink:
    "/docs/deployment/troubleshooting#missing-environment-variables",
  isRequired: true,
  estimatedTime: 3,
};
```

---

## Relationships

```
EnvironmentProfile
  ├─ has many: EnvVariable[]
  ├─ has many: ConfigurationError[] (during validation)
  └─ produces: HealthCheckResult (health check output)

EnvVariable
  ├─ validates against: valuePattern (RegExp)
  └─ can fail with: ConfigurationError

ConfigurationError
  ├─ references: EnvVariable by name
  ├─ included in: HealthCheckResult.errors[] or .warnings[]
  └─ mapped in: DeploymentVerificationChecklist troubleshooting

HealthCheckResult
  ├─ populated from: EnvironmentProfile validation
  └─ used by: Vercel health check endpoint response

DeploymentVerificationChecklist
  └─ references: ConfigurationError codes for troubleshooting links
```

---

## Validation Rules Summary

### Environment Variable Validation Sequence

1. **Presence Check**: Variable exists in `process.env` and is not empty string
   - Error: `MISSING_DATABASE_URL`
   - Severity: Critical (deployment fails)

2. **Format Check**: Value matches expected pattern (if pattern defined)
   - Error: `INVALID_DATABASE_URL_FORMAT`
   - Severity: Critical

3. **Connectivity Check**: Attempt test connection to database
   - Error: `DATABASE_CONNECTION_FAILED`
   - Severity: Critical (wrong credentials, network unreachable)
   - Transient failures treated differently: may defer to reattempt

### Failure Strategy

- **Critical Errors**: Throw during module initialization → Vercel deployment marked unhealthy → Ops must redeploy
- **Warnings**: Log but allow deployment to continue → Health endpoint returns 200 with warnings
- **Transient Errors**: Retry with backoff; if persistent after timeout, mark unhealthy

---

## TypeScript Type Definitions

```typescript
// Enum for environment names
type EnvironmentName = "production" | "preview" | "local";

// Enum for health statuses
type HealthStatus = "healthy" | "unhealthy" | "degraded";
type DatabaseStatus = "connected" | "disconnected" | "unreachable";
type EnvStatus = "validated" | "invalid";

// Enum for error severity
type ErrorSeverity = "critical" | "warning";

// Entity interfaces
interface EnvVariable {
  name: string;
  purpose: string;
  required: boolean;
  format: string | null;
  valuePattern: RegExp | null;
  example: string;
  sourced: string;
}

interface EnvironmentProfile {
  name: EnvironmentName;
  requiredVariables: EnvVariable[];
  isProduction: boolean;
  healthCheckEnabled: boolean;
}

interface ConfigurationError {
  code: string;
  severity: ErrorSeverity;
  variable: string;
  message: string;
  hint: string;
  location: string;
  timestamp: Date;
}

interface HealthCheckResult {
  status: HealthStatus;
  database: DatabaseStatus;
  environment: EnvStatus;
  errors: ConfigurationError[];
  warnings: ConfigurationError[];
  timestamp: Date;
  responseTime: number;
}

interface DeploymentVerificationChecklist {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  troubleshootingLink: string | null;
  isRequired: boolean;
  estimatedTime: number;
}
```

---

## Usage in Implementation

**Phase 2 Implementation** will use these entities to:

1. Define required variables in `lib/constants.ts`
2. Implement validation logic in `lib/envValidation.ts`
3. Create error types in `lib/errors.ts`
4. Build health check endpoint in `app/api/health/route.ts`
5. Generate deployment checklist in deployment documentation
6. Create integration tests using these types as test fixtures

---

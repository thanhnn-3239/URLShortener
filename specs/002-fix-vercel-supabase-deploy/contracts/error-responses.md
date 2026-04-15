# Error Response Contract - Configuration Errors

**Feature**: Environment Validation & Deployment Health
**Version**: 1.0
**Date**: 2026-04-15

---

## Overview

This contract defines the standard error response format for configuration and environment validation failures in API responses. It ensures consistency across all endpoints when deployment configuration is invalid.

---

## Standard Configuration Error Responses

All API endpoints return a standard error structure when configuration is invalid:

### Generic Configuration Error (503 Service Unavailable)

```json
{
  "error": {
    "code": "DEPLOYMENT_UNHEALTHY",
    "message": "Deployment configuration is invalid. Please check environment variables.",
    "status": 503,
    "timestamp": "2026-04-15T10:30:45.123Z",
    "details": {
      "validation": "invalid",
      "missingVariables": ["DATABASE_URL"],
      "contactSupport": false
    }
  }
}
```

---

## Error Response in Business Endpoints

When any business endpoint (shorten, redirect, analytics) detects configuration error:

**Status**: `503 Service Unavailable`

**Body**:
```json
{
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Service temporarily unavailable due to configuration issue.",
    "status": 503,
    "timestamp": "2026-04-15T10:30:45.123Z",
    "hint": "Check the health endpoint (GET /api/health) for details. Contact platform support if issue persists.",
    "details": {
      "validation": "invalid",
      "contactURL": "/api/health"
    }
  },
  "requestId": "req_12345"
}
```

---

## Standard Error Code Mapping

| Code | HTTP Status | Severity | Meaning | User Action |
|------|-------------|----------|---------|-------------|
| `DEPLOYMENT_UNHEALTHY` | 503 | Critical | General deployment config failure | Check `/api/health` for details |
| `DATABASE_UNAVAILABLE` | 503 | Critical | Database connection failed | Check `/api/health`; verify Supabase credentials |
| `ENV_VALIDATION_FAILED` | 503 | Critical | Environment variable validation failed | Set required env vars in Vercel Project Settings |
| `MISSING_DATABASE_URL` | 503 | Critical | DATABASE_URL not set | Set DATABASE_URL in Vercel |
| `DATABASE_CONNECTION_FAILED` | 503 | Critical | Cannot connect with given credentials | Verify credentials with Supabase console |
| `INVALID_CREDENTIALS` | 503 | Critical | Auth credentials invalid | Check Supabase project settings |

---

## Error Response Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `error.code` | string | yes | Uppercase error code constant |
| `error.message` | string | yes | Brief human-readable error description |
| `error.status` | number | yes | HTTP status code |
| `error.timestamp` | string | yes | ISO 8601 UTC timestamp when error occurred |
| `error.hint` | string | no | Actionable guidance for resolution |
| `error.details` | object | yes | Metadata about the error |
| `requestId` | string | no | Unique request identifier for logging |

---

## Details Object Structure

Common `details` fields:

| Field | Type | Description |
|-------|------|-------------|
| `validation` | string | `"invalid"` \| `"unchecked"` |
| `missingVariables` | string[] | List of missing required env vars (if applicable) |
| `invalidVariables` | string[] | List of env vars with invalid format |
| `contactURL` | string | URL to health endpoint or docs |
| `contactSupport` | boolean | true = user should contact support |
| `affectedEndpoints` | string[] | List of affected API routes |

---

## Logging Contract

When configuration errors occur, the following MUST be logged:

```json
{
  "level": "error",
  "timestamp": "2026-04-15T10:30:45.123Z",
  "event": "deployment_config_validation_failed",
  "context": {
    "environment": "production",
    "endpoint": "/api/shorten",
    "validationErrors": [
      {
        "variable": "DATABASE_URL",
        "reason": "missing",
        "suggested_fix": "Set in Vercel Project Settings → Environment Variables"
      }
    ]
  },
  "message": "Configuration validation failed for production environment"
}
```

---

## Error Handling Flow

```
Request arrives
  ↓
[ENV Validation at startup already completed and passed OR failed]
  ↓
If validation failed at startup:
  → Deployment marked unhealthy
  → Vercel stops routing requests
  → Health endpoint returns 503
  ↓
If validation passed at startup:
  → Request proceeds normally
  → If runtime DB error: Check connection pool
  → Return appropriate business error (not config error)
```

---

## No Configuration Errors at Request Time (by design)

**Important**: Configuration errors are caught at **startup/initialization**, not at request time.

- If a request reaches a business endpoint, configuration MUST be valid
- If configuration is invalid, the deployment never reaches this state
- Request-time errors are **business logic errors**, not configuration errors

Examples of business errors (NOT configuration errors):
- Database query fails due to permissions: Return 403 with appropriate message
- Database is temporarily unreachable (network issue): Return 503 with retry guidance
- Requested resource not found: Return 404

---

## Testing Configuration Error Responses

### Unit Test Example

```typescript
test("should return 503 when DATABASE_URL is missing", async () => {
  // Unset DATABASE_URL for this test
  delete process.env.DATABASE_URL;

  // Should throw during app initialization and not serve requests
  expect(() => require("./lib/database")).toThrow();
});

test("health endpoint returns 503 with missing DATABASE_URL error", async () => {
  const response = await fetch("/api/health");
  expect(response.status).toBe(503);

  const body = await response.json();
  expect(body.error.code).toBe("MISSING_DATABASE_URL");
  expect(body.error.status).toBe(503);
});
```

### Integration Test Example

```typescript
test("deployment fails when DATABASE_URL is invalid format", async () => {
  // Set invalid URL
  process.env.DATABASE_URL = "not-a-valid-url";

  // Expect initialization to fail
  const { stdout, stderr } = await spawn("node", ["server.js"]);
  expect(stderr).toContain("INVALID_DATABASE_URL_FORMAT");
});
```

---

## Client-Side Handling

### Frontend Client Expectations

When a frontend receives a 503 response:

```typescript
fetch("/api/shorten", { method: "POST", body: shortUrlData })
  .then((res) => {
    if (res.status === 503) {
      // Configuration error - inform user deployment is unhealthy
      setError("Service temporarily unavailable. Contact support.");
      // Optionally: Suggest checking /api/health status
    }
    return res.json();
  })
  .catch((err) => {
    // Network error
    setError("Network error. Check your connection.");
  });
```

---

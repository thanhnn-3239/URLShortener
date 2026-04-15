# Health Check Endpoint Contract

**Feature**: Environment Validation & Deployment Health
**Version**: 1.0
**Date**: 2026-04-15

---

## Endpoint: GET /api/health

### Purpose

Vercel health check endpoint that validates all required environment variables and database connectivity. Used by Vercel's automatic health checks to determine if the deployment is healthy and ready to serve traffic.

### Request

```
GET /api/health HTTP/1.1
Host: [deployment-url]
```

**Query Parameters**: None

**Headers**:
- Standard HTTP headers (no special requirements)

**Body**: Empty

### Success Response (200 OK)

**Status**: `200 OK`

**Content-Type**: `application/json`

**Body**:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "validated",
  "errors": [],
  "warnings": [],
  "timestamp": "2026-04-15T10:30:45.123Z",
  "responseTime": 45
}
```

**Schema**:

| Field        | Type     | Required | Description |
|--------------|----------|----------|-------------|
| `status`     | string   | yes      | Always `"healthy"` for 200 response |
| `database`   | string   | yes      | `"connected"` \| `"disconnected"` |
| `environment`| string   | yes      | `"validated"` (always for 200) |
| `errors`     | array    | yes      | Empty array for 200 response |
| `warnings`   | array    | yes      | May contain non-critical issues |
| `timestamp`  | string   | yes      | ISO 8601 UTC timestamp |
| `responseTime`| number  | yes      | Milliseconds to complete check |

---

### Error Response (503 Service Unavailable)

**Status**: `503 Service Unavailable`

**Content-Type**: `application/json`

**Body**:
```json
{
  "status": "unhealthy",
  "database": "unreachable",
  "environment": "invalid",
  "errors": [
    {
      "code": "MISSING_DATABASE_URL",
      "severity": "critical",
      "variable": "DATABASE_URL",
      "message": "Required environment variable 'DATABASE_URL' is not set or is empty.",
      "hint": "Set DATABASE_URL in Vercel Project Settings → Environment Variables",
      "location": "Vercel Dashboard → Project Settings → Environment Variables"
    },
    {
      "code": "DATABASE_CONNECTION_FAILED",
      "severity": "critical",
      "variable": "DATABASE_URL",
      "message": "Failed to connect to database. Check credentials and network connectivity.",
      "hint": "Verify DATABASE_URL value matches Supabase project connection string. Test connectivity to db.supabase.co.",
      "location": "Vercel Project Settings or check Supabase status page"
    }
  ],
  "warnings": [],
  "timestamp": "2026-04-15T10:30:45.123Z",
  "responseTime": 1250
}
```

**Schema**:

| Field        | Type     | Required | Description |
|--------------|----------|----------|-------------|
| `status`     | string   | yes      | `"unhealthy"` (for 503) or `"degraded"` (for 200 with warnings) |
| `database`   | string   | yes      | `"unreachable"` \| `"disconnected"` (for 503) |
| `environment`| string   | yes      | `"invalid"` for 503 |
| `errors`     | array    | yes      | Array of `ConfigurationError` objects |
| `warnings`   | array    | yes      | Array of non-critical issues (may be empty) |
| `timestamp`  | string   | yes      | ISO 8601 UTC timestamp |
| `responseTime`| number  | yes      | Milliseconds elapsed (may be longer due to retries) |

**Error Object Schema**:

| Field      | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `code`    | string | yes      | Error code constant (e.g., `"MISSING_DATABASE_URL"`) |
| `severity`| string | yes      | `"critical"` \| `"warning"` |
| `variable`| string | yes      | Environment variable name |
| `message` | string | yes      | Human-readable error description |
| `hint`    | string | yes      | Actionable guidance to resolve |
| `location`| string | yes      | Where to make the fix in Vercel (specific UI path) |

---

## Response Codes

| Code | Condition | Meaning |
|------|-----------|---------|
| `200` | All env vars present, format valid, database connected | Deployment is healthy and ready |
| `503` | Any critical env validation failure (missing, invalid format, connection failed) | Deployment is unhealthy; Vercel will show failure in dashboard |
| `500` | Unexpected error (e.g., unable to read environment system) | Server error; Vercel treats as unhealthy |

---

## Standard Error Codes

```
MISSING_DATABASE_URL
INVALID_DATABASE_URL_FORMAT
DATABASE_CONNECTION_FAILED
MISSING_SUPABASE_KEY
INVALID_SUPABASE_KEY_FORMAT
SUPABASE_CONNECTION_FAILED
ENVIRONMENT_VALIDATION_FAILED
DEPLOYMENT_UNHEALTHY
```

---

## Validation Sequence

The health check performs the following checks in order:

1. **Presence Check** (synchronous):
   - Required environment variable exists in `process.env`
   - Not an empty string
   - Error if missing: `MISSING_DATABASE_URL`

2. **Format Check** (synchronous):
   - Value matches expected pattern (e.g., `postgresql://` for DATABASE_URL)
   - Error if invalid: `INVALID_DATABASE_URL_FORMAT`

3. **Connectivity Check** (with timeout):
   - Attempt a non-modifying test query (e.g., `SELECT 1`)
   - Timeout: 5 seconds
   - Error if failed: `DATABASE_CONNECTION_FAILED`

---

## Performance Requirements

- **Response time**: MUST complete in < 1 second for healthy deployment
- **Validation overhead**: < 50ms for presence and format checks
- **Connection test**: < 500ms (max 5s if network slow)
- **No request queuing**: Health check MUST NOT block other incoming requests

---

## Vercel Integration

### Health Check Configuration in Vercel

Vercel's built-in health check feature:
- Default path: `/api/health`
- Default interval: 60 seconds
- Failure threshold: 1 consecutive failure marks deployment unhealthy
- Recovery threshold: 1 successful check marks deployment healthy again

**When health check fails**:
1. Vercel Dashboard shows 🔴 red status for the deployment
2. New traffic is NOT routed to unhealthy deployment
3. Previous deployment (if exists) continues serving traffic
4. Alert/notification sent to project maintainers

### Recommended Vercel Health Check Settings

In **Project Settings → Deployments → Health Check**:
```
✓ Enable Health Check
Path: /api/health
Timeout: 10 seconds
Frequency: 60 seconds
```

---

## Examples

### Example 1: Healthy Deployment

```bash
curl -i https://myapp.vercel.app/api/health
```

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "healthy",
  "database": "connected",
  "environment": "validated",
  "errors": [],
  "warnings": [],
  "timestamp": "2026-04-15T10:30:45.123Z",
  "responseTime": 45
}
```

### Example 2: Missing Database URL

```bash
curl -i https://myapp.vercel.app/api/health
```

```
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  "status": "unhealthy",
  "database": "unreachable",
  "environment": "invalid",
  "errors": [
    {
      "code": "MISSING_DATABASE_URL",
      "severity": "critical",
      "variable": "DATABASE_URL",
      "message": "Required environment variable 'DATABASE_URL' is not set or is empty.",
      "hint": "Add DATABASE_URL to Vercel Project Settings → Environment Variables section.",
      "location": "Vercel Dashboard → Project Settings → Environment Variables"
    }
  ],
  "warnings": [],
  "timestamp": "2026-04-15T10:30:45.123Z",
  "responseTime": 23
}
```

### Example 3: Wrong Credentials (Connection Failure)

```bash
curl -i https://myapp.vercel.app/api/health
```

```
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  "status": "unhealthy",
  "database": "unreachable",
  "environment": "invalid",
  "errors": [
    {
      "code": "DATABASE_CONNECTION_FAILED",
      "severity": "critical",
      "variable": "DATABASE_URL",
      "message": "Failed to connect to Supabase database: password authentication failed for user \"postgres\"",
      "hint": "Verify DATABASE_URL credentials match your Supabase project. Test with a simple psql command using the connection string.",
      "location": "Supabase Console → Project Settings → Connection Details; Vercel Settings → Environment Variables"
    }
  ],
  "warnings": [],
  "timestamp": "2026-04-15T10:30:45.123Z",
  "responseTime": 4200
}
```

---

## Testing Strategy

### Unit Tests
- Test response structure with valid environment
- Test response structure with missing env var
- Test response codes (200 vs 503)

### Integration Tests
- Deploy to Vercel Preview with missing DATABASE_URL; expect 503
- Deploy to Vercel Preview with valid DATABASE_URL; expect 200
- Verify Vercel health check dashboard shows correct status

### Contract Tests
- Response schema validation (presence of all fields)
- Error code uniqueness and format
- Timestamp format (ISO 8601)

---

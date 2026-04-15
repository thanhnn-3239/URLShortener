# Research: Environment Validation for Production Deployment

**Phase**: 0 - Research & Clarification
**Date**: 2026-04-15
**Status**: Resolved

---

## Research Questions & Resolutions

### Q1: Best Practice for Fail-Fast Environment Validation in Next.js 14 + Vercel

**Decision**: Validate environment variables at module initialization time (not per-request).

**Rationale**:
- Vercel runs `next build` at deployment time, but the actual runtime processes start fresh when the deployment becomes live
- By throwing an error during the initialization of `lib/database.ts` (which is imported early), we ensure the deployment health check fails immediately
- This is more reliable than checking at request time because it catches misconfiguration before the first user request
- Aligns with "fail fast" principle from specification

**Alternatives Considered**:
- Per-request validation: Would defer error detection until traffic hits, wasting resources and user time
- Build-time validation only: Build succeeds even with invalid env; production fails at runtime with obscure errors
- Lazy validation: Delays detection until specific endpoint is hit; inconsistent behavior across endpoints

**Best Practices**:
- Use `getEnv()` pattern that reads and validates at import time, throwing early
- Log validation errors with clear guidance before throwing
- Vercel's health checks (via `GET /api/health`) will detect and report unhealthy deployments

---

### Q2: Vercel Environment Variable Scoping (Production vs. Preview)

**Decision**: Enforce required environment variables for BOTH Production and Preview deployments on Vercel.

**Rationale**:
- Preview deployments are pull request environments that test code in a production-like setup
- If Preview passes with missing env but Production fails, the dev and ops teams learn different validation paths
- Preview environments must use real credentials (production-intended or safe test credentials) to be useful
- Vercel's UI and API support separate env configurations per environment type

**Alternatives Considered**:
- Only validate in Production: Developers miss misconfiguration in PR testing
- Skip validation for Preview: Deployment complexity masks issues until production release

**Vercel Configuration**:
- Use Project Settings → Environment Variables
- Set "Environment" to "Production and Preview" for required Supabase credentials
- Use separate, non-production Supabase instance for Preview if possible (separate URL + token)
- Document which variables are required vs. optional per environment

---

### Q3: Error Message Strategy for Configuration Errors

**Decision**: Use structured, actionable error messages with:
1. What is wrong (missing variable name or invalid format)
2. What should be fixed (expected variable name, example format)
3. Where to fix it (Vercel Project Settings → Environment Variables section)

**Rationale**:
- Operators are often different people from developers
- Errors must be copyable and unambiguous in logs
- Prevents trial-and-error debugging that wastes production time

**Error Message Format**:
```
Configuration Error: Database URL not found.
Expected environment variable: DATABASE_URL
Format: postgresql://user:password@host:port/dbname
Location: Set in Vercel Project Settings → Environment Variables
Learn more: [link to deployment guide]
```

---

### Q4: Health Check Endpoint for Deployment Verification

**Decision**: Implement `GET /api/health` endpoint that:
- Returns `200 OK` if all required environment variables are valid
- Returns `503 Service Unavailable` if any required variable is missing or invalid
- Includes JSON response body with validation status details

**Rationale**:
- Vercel's built-in health checks use `/api/health` by default
- HTTP status codes are standardized and automatically reported in Vercel dashboard
- Developers and operators can immediately verify deployment without triggering business logic
- Database connection test in health check confirms not just env presence, but actual connectivity

**Health Check Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "validated",
  "timestamp": "2026-04-15T10:30:00Z"
}
```

or (unhealthy):
```json
{
  "status": "unhealthy",
  "errors": [
    {
      "code": "MISSING_DATABASE_URL",
      "message": "DATABASE_URL environment variable not found",
      "location": "Vercel Project Settings → Environment Variables"
    }
  ],
  "timestamp": "2026-04-15T10:30:00Z"
}
```

---

### Q5: Handling Invalid Format or Credentials (beyond just presence)

**Decision**: Validate:
- Presence (required variable exists)
- Format (URL-like credentials match pattern)
- Connectivity (test connection at startup via test query)

**Rationale**:
- Empty strings and malformed URLs are common human errors
- Full connectivity test at startup catches credential mismatches before user impact
- Separates configuration errors from transient network/database issues

**Validation Levels**:
1. **Presence**: `process.env.DATABASE_URL` is defined and non-empty
2. **Format**: Matches PostgreSQL URL pattern `postgresql://...`
3. **Connectivity**: Attempt non-modifying test query (e.g., `SELECT 1`) with timeout
4. **Key Headers** (Supabase-specific): Validates API key format if using Supabase direct access

---

### Q6: Distinguishing Configuration Errors from Transient Database Issues

**Decision**:
- Configuration errors (missing/malformed env): Throw at startup, prevent deployment from becoming healthy
- Transient issues (network timeout, database unreachable): Allow graceful degradation initially, but fail health check if persistent

**Rationale**:
- Configuration mistakes need human intervention and redeploy
- Transient network issues may self-heal; immediate restart is wasteful
- Health check provides early detection mechanism

**Implementation**:
- Validation: Synchronous checks with short timeout at startup
- Startup error: Throw with non-zero exit code if validation fails (Vercel detects and marks unhealthy)
- Health endpoint: Returns 503 if recent connectivity issues; ops team can manually trigger redeploy if needed

---

## Summary Table

| Question | Decision | Validation Method | Measurable Outcome |
|----------|----------|-------------------|-------------------|
| When to validate? | Startup (module init) | Check at `database.ts` import | Deployment health detected within 30s |
| Which environments? | Production + Preview | Same required env list for both | All deployments consistent |
| Error messages | Structured & actionable | Include variable name, format, location | Ops can fix in <5 min from logs |
| Health check endpoint | `GET /api/health` with 503 on failure | Test connectivity + env presence | Vercel dashboard shows status in real-time |
| Specific format checks? | URL pattern + connectivity test | Regex match + test query | 100% of invalid credentials caught at startup |

---

## Next Steps (Phase 1)

- **Data Model**: Define `EnvironmentProfile`, `EnvVariable`, `ValidationError` entities
- **Contracts**: API contracts for health endpoint and error response format
- **Quickstart**: Step-by-step Vercel setup guide with screenshots and troubleshooting

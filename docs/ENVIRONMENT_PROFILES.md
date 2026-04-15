# Deployment Environment Profiles

**Date**: 2026-04-15
**Purpose**: Clarify configuration requirements for different deployment environments

---

## Overview

The URL Shortener application supports three deployment environments with different configuration strictness levels:

| Environment | Platform | Production-Like | Config Strictness | Failure Behavior |
|---|---|---|---|---|
| **Production** | Vercel main branch | ✓ YES | STRICT (fail-fast) | App fails to start |
| **Preview** | Vercel preview deployments | ✓ YES | STRICT (fail-fast) | App fails to start |
| **Local** | Local development machine | ✗ NO | PERMISSIVE | Mock DB fallback |

---

## Production Environment

**Platform**: Vercel (production branch deployment)
**Deployment Type**: Primary production environment
**Audience**: End users, production traffic

### Configuration Requirements

- ✓ **DATABASE_URL**: Required, must be valid PostgreSQL URL
- ✓ **SUPABASE_ANON_KEY**: Required, must be valid JWT
- ✓ **SUPABASE_SERVICE_ROLE_KEY**: Required, must be valid JWT
- ✓ **Health Check**: Must pass (GET /api/health → 200)

### What Happens at Startup

1. App initializes on Vercel
2. Validates all 3 required environment variables (fail-fast)
3. Tests database connection if validation passes
4. If ANY error: App crashes with detailed error logs
5. Deployment marked UNHEALTHY → Cannot serve traffic

### Configuration via Vercel

Set `DATABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in:

**Vercel Dashboard:**
```
Project Settings → Environment Variables → Select "Production" environment
```

**Vercel CLI:**
```bash
vercel env add DATABASE_URL --environments production
vercel env add SUPABASE_ANON_KEY --environments production
vercel env add SUPABASE_SERVICE_ROLE_KEY --environments production
```

See [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) for detailed instructions.

---

## Preview Environment

**Platform**: Vercel (preview deployments from pull requests)
**Deployment Type**: Pre-production testing environment
**Audience**: Developers, QA, testing
**Key Point**: Preview is ALSO production-like and requires same environment config

### Configuration Requirements

⚠️ **IMPORTANT**: Preview deployments have the SAME strictness as Production:

- ✓ **DATABASE_URL**: Required, must be valid PostgreSQL URL
- ✓ **SUPABASE_ANON_KEY**: Required, must be valid JWT
- ✓ **SUPABASE_SERVICE_ROLE_KEY**: Required, must be valid JWT
- ✓ **Health Check**: Must pass (GET /api/health → 200)

### What Happens at Startup

1. PR is created → Vercel automatically creates preview deployment
2. App initializes with environment variables from Vercel
3. Validates all 3 required variables (same fail-fast as Production)
4. If ANY error: Preview deployment fails
5. Deployment marked UNHEALTHY → Cannot view/test in preview

### Why Preview is Strict

- Catch configuration issues **before** merging to main
- Ensure deployment configuration is correct early
- Prevent untested config from reaching production
- Test against real Supabase database (if separate project)

### Configuration via Vercel

Set environment variables for Preview:

**Best Practice**: Use same variables as Production (point to production database):
```bash
vercel env add DATABASE_URL --environments preview
vercel env add SUPABASE_ANON_KEY --environments preview
vercel env add SUPABASE_SERVICE_ROLE_KEY --environments preview
```

**Or** (if you want separate Preview database):
```bash
vercel env add DATABASE_URL_PREVIEW --environments preview
# Then use VERCEL_ENV to detect and switch between databases
```

---

## Local Development Environment

**Platform**: Local machine (laptop, desktop)
**Deployment Type**: Development only
**Audience**: Developers
**Key Point**: Local can skip or partially provide env vars

### Configuration Requirements

Local development is more permissive than Production/Preview:

- ☐ **DATABASE_URL**: Optional (falls back to in-memory mock DB)
- ☐ **SUPABASE_ANON_KEY**: Optional (falls back to mock)
- ☐ **SUPABASE_SERVICE_ROLE_KEY**: Optional (falls back to mock)

### What Happens at Startup

1. App starts locally
2. Detects NODE_ENV=development or missing DATABASE_URL
3. Uses in-memory mock database (no validation required)
4. Full feature set available for local development
5. No connection to Supabase needed

### Configuration via .env.local

For local development, create `.env.local` in repository root:

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# (Optional) Edit .env.local and add your Supabase credentials:
# DATABASE_URL=postgresql://...
# SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...

# .env.local should NEVER be committed to git
```

⚠️ **NEVER commit .env.local or any file with secrets to git**

---

## Environment Detection

The app automatically detects which environment is running:

```typescript
// From lib/envValidation.ts
function detectEnvironmentType(): EnvironmentType {
  const vercelEnv = process.env.VERCEL_ENV;
  const isVercelDeployment = !!process.env.VERCEL_URL;

  if (!isVercelDeployment) {
    return "local"; // Local development
  }

  if (vercelEnv === "production") {
    return "production"; // Production branch on Vercel
  }

  if (vercelEnv === "preview") {
    return "preview"; // Preview deployment on Vercel
  }

  return "preview"; // Default if VERCEL_ENV not set
}
```

Environment is detected from:
- `VERCEL_ENV` — Set by Vercel automatically ("production", "preview", or undefined)
- `VERCEL_URL` — Set by Vercel for all deployments
- `NODE_ENV` — Set locally ("development")

---

## Configuration Strictness Comparison

| Aspect | Production | Preview | Local |
|--------|-----------|---------|-------|
| Missing DATABASE_URL | ✗ App fails to start | ✗ App fails to start | ✓ Falls back to mock |
| Invalid DATABASE_URL format | ✗ App fails to start | ✗ App fails to start | ✓ Falls back to mock |
| Missing SUPABASE keys | ✗ App fails to start | ✗ App fails to start | ✓ Falls back to mock |
| Health endpoint at /api/health | ✓ Returns 200 | ✓ Returns 200 | ✓ Returns mock data |
| Database connectivity test | ✓ Real test | ✓ Real test | ✓ Mock passes |
| Startup time penalty | ~50ms | ~50ms | 0ms (no validation) |

---

## Troubleshooting by Environment

### Production Deployment Failed

1. Check Vercel deployment logs:
   ```bash
   vercel logs --prod --tail
   ```

2. Verify all 3 env vars are set in Vercel UI (Production environment)

3. Redeploy:
   ```bash
   vercel deploy --prod
   ```

See [DEPLOYMENT.md](../DEPLOYMENT.md#troubleshooting) for detailed troubleshooting.

### Preview Deployment Failed

1. Check PR preview deployment status on Vercel

2. Click deployment logs to see startup errors

3. Verify environment variables are set for Preview in Vercel UI

4. If using different database, ensure it's active and accessible

### Local Development Issues

1. If using real database locally, verify `DATABASE_URL` is in `.env.local`

2. Test connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. If no .env.local, app falls back to in-memory mock (expected behavior)

---

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment walkthrough.

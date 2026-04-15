# Vercel Environment Variable Setup Reference

**Date**: 2026-04-15
**Purpose**: Quick reference for required environment variables in Vercel
**Audience**: DevOps, deployment engineers

---

## Required Environment Variables

All three variables are **REQUIRED** for Production and Preview deployments on Vercel.

| Variable | Purpose | Format | Where to Find in Supabase | Prod | Preview |
|----------|---------|--------|---------------------------|------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Supabase database | `postgresql://user:password@host:5432/database` | **Supabase Dashboard → Settings → Database → Connection Strings → URI** | ✓ | ✓ |
| `SUPABASE_ANON_KEY` | Public API key for client-side access (safe to expose) | Base64-encoded JWT, starts with `eyJ...` | **Supabase Dashboard → Settings → API → Project API Keys → public/anon** | ✓ | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side API key with full access (secret, keep secure) | Base64-encoded JWT, starts with `eyJ...` | **Supabase Dashboard → Settings → API → Project API Keys → secret/service_role** | ✓ | ✓ |

---

## Setting Variables in Vercel

### Via Vercel CLI

```bash
# Set for both Production and Preview
vercel env add DATABASE_URL --environments production preview
vercel env add SUPABASE_ANON_KEY --environments production preview
vercel env add SUPABASE_SERVICE_ROLE_KEY --environments production preview

# List all variables
vercel env ls

# Delete a variable (if needed)
vercel env rm DATABASE_URL
```

### Via Vercel Dashboard

1. Go to your project on **vercel.com**
2. Click **Settings → Environment Variables**
3. For each variable:
   - Click **"Add New"**
   - Name: `DATABASE_URL` (or other name)
   - Value: Paste the value from Supabase
   - Environments: **Check Both "Production" and "Preview"**
   - Click **Save**

---

## Getting Values from Supabase

### DATABASE_URL

1. Login to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → Database → Connection Strings**
4. Select **"URI"** (not "Psql" or "JDBC")
5. Copy the full URI string
6. **Replace `[YOUR-PASSWORD]` with your actual database password**

Example:
```
postgresql://postgres:your_password_here@db.ouhokplcjkqmxqskhgal.supabase.co:5432/postgres
```

### SUPABASE_ANON_KEY

1. Go to **Settings → API → Project API Keys** (or **Settings → API**)
2. Find the row labeled **"anon public"** or **"public/anon"**
3. Copy the value (starts with `eyJ...`)

Example:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjAwMDAwMCwiZXhwIjoxNjE2MDAwMDAwfQ.SUPABASE_ANON_KEY_HASH
```

### SUPABASE_SERVICE_ROLE_KEY

1. Go to **Settings → API → Project API Keys** (or **Settings → API**)
2. Find the row labeled **"service_role" or "secret"** key
3. Copy the value (starts with `eyJ...`)
4. ⚠️ **CRITICAL**: Keep this value SECRET — never commit to git or expose publicly

Example:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MDAwMDAwLCJleHAiOjE2MTYwMDAwMDB9.SERVICE_ROLE_KEY_HASH
```

---

## Important Notes

⚠️ **Do NOT expose SERVICE_ROLE_KEY in client-side code**
- The service role key has full database access
- Should only be used in server-side code (API routes, server components)
- If exposed, anyone can modify or delete data

✅ **ANON_KEY can be public**
- It's safe to include in browser code or frontend
- Has limited access (defined by Supabase RLS policies)
- Use this for client-side Supabase access

✅ **Set BOTH Production AND Preview environments**
- Both deployment types on Vercel need the same variables
- No environment variables carry over between them
- Redeploy after changing Vercel environment variables

---

## Best Practices for Multiple Environments

### Recommended: Separate Supabase Projects

For best isolation:
- **Production**: Points to Supabase Project A (DATABASE_URL_PROD, etc.)
- **Preview**: Points to Supabase Project B (DATABASE_URL_PREVIEW, etc.)
- **Local**: Points to local PostgreSQL or Supabase Project C

Set different DATABASE_URL values in Vercel:
```bash
vercel env rm DATABASE_URL  # Remove if exists
vercel env add DATABASE_URL_PROD --environments production
vercel env add DATABASE_URL_PREV --environments preview
```

Then in your code, use:
```typescript
const dbUrl = process.env.VERCEL_ENV === "production"
  ? process.env.DATABASE_URL_PROD
  : process.env.DATABASE_URL_PREV;
```

### Acceptable: Same Supabase Project for Prod + Preview

If using the same project for both:
- Set the **same DATABASE_URL for both Production and Preview** in Vercel
- Make sure Supabase project can handle both deployments
- Monitor database capacity and connection limits
- Consider setting up read replicas for Preview

---

## Verification Checklist

Before deploying, verify:

- [ ] DATABASE_URL is set in Vercel for both Production and Preview
- [ ] DATABASE_URL format is `postgresql://...` (not other formats)
- [ ] DATABASE_URL includes the correct password
- [ ] SUPABASE_ANON_KEY is set in Vercel for both Production and Preview
- [ ] SUPABASE_ANON_KEY is 50+ characters long (base64 encoded)
- [ ] SUPABASE_SERVICE_ROLE_KEY is set in Vercel for both Production and Preview
- [ ] SUPABASE_SERVICE_ROLE_KEY is 50+ characters long
- [ ] All three variables have "Production" environment selected in Vercel
- [ ] All three variables have "Preview" environment selected in Vercel
- [ ] Supabase project status is "Active" (not paused)
- [ ] Network connectivity from Vercel to Supabase is not blocked

---

## Testing Your Configuration

Once variables are set in Vercel, test:

```bash
# Test the health endpoint
curl https://your-vercel-deployment.com/api/health

# Expected response (200 OK):
{
  "status": "healthy",
  "database": "connected",
  "environment": "validated",
  "errors": [],
  "timestamp": "2026-04-15T...",
  "responseTime": 45
}
```

If you get 503, check the error response for which variable is missing or invalid:

```bash
curl https://your-vercel-deployment.com/api/health | jq .errors
```

---

## Troubleshooting

**"DATABASE_URL is empty in the app"**
- Verify no spaces around the value in Vercel UI
- Check Vercel deployment logs: `vercel logs --tail`
- Redeploy after changing: `vercel deploy --prod`

**"Connection refused"**
- Check Supabase project is Active (not paused)
- Verify password is correct in DATABASE_URL
- Test connection locally: `psql $DATABASE_URL -c "SELECT 1"`

**"Invalid JWT" (for SUPABASE_ANON_KEY or SERVICE_ROLE_KEY)**
- Make sure you copied the full base64 string (50+ characters)
- Don't include quotes or extra whitespace
- Verify it starts with `eyJ...`

---

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment walkthrough.

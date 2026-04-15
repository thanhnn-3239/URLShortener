# Deployment Guide: Vercel + Supabase Production Deployment

**Last Updated**: 2026-04-15
**Target Audience**: DevOps engineers, backend developers, deployment operators
**Estimated Time**: 15-20 minutes for first-time deployment

---

## Overview

This guide walks through deploying the URL Shortener application to Vercel with Supabase as the database backend. The deployment requires three essential environment variables to be configured correctly:

- `DATABASE_URL` — PostgreSQL connection string
- `SUPABASE_ANON_KEY` — Public API key for client-side access
- `SUPABASE_SERVICE_ROLE_KEY` — Service key for server-side operations

Both **Production** and **Preview** deployments on Vercel require these variables to be set correctly.

---

## Step 1: Pre-Deployment Checklist

Before starting, gather the following information:

- [ ] Supabase project is created and active (not paused)
- [ ] Supabase dashboard access credentials
- [ ] GitHub repository URL with the codebase
- [ ] Vercel account with project creation permissions
- [ ] Code changes are committed to a branch (ready to deploy)

---

## Step 2: Repository Preparation

Ensure your code is ready to deploy:

1. Commit all changes:
   ```bash
   git add .
   git commit -m "Deployment ready"
   git push origin your-branch
   ```

2. Verify `.env.local` is **NOT** committed (should be in `.gitignore`):
   ```bash
   git status  # Should NOT show .env.local, .env.production, etc.
   ```

3. Verify `package.json` has required scripts:
   ```bash
   npm run build  # Should succeed without errors
   npm run lint   # Should pass linting checks
   npm test       # Should pass all tests (optional but recommended)
   ```

---

## Step 3: Create or Link Vercel Project

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Create a new project or link existing:
   ```bash
   vercel
   ```

   Follow the prompts to select the project directory and configure the project.

### Option B: Using Vercel Dashboard (Web UI)

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose your GitHub repository
4. Click "Import"
5. Configure project settings (use defaults)
6. Click "Deploy"

---

## Step 4: Configure Environment Variables in Vercel

### 4.1 Get Connection Details from Supabase

1. Login to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → Database → Connection String** (bottom of page)
4. Select **"URI"** option and copy the connection string
5. **Replace** the password placeholder with your actual database password

Expected format:
```
postgresql://postgres:[YOUR_PASSWORD]@db.[REGION].supabase.co:5432/postgres
```

### 4.2 Get API Keys from Supabase

1. In Supabase Dashboard, go to **Settings → API → Project API keys** (or **Project Settings → API**)
2. Copy the **"public/anon" key** → This is `SUPABASE_ANON_KEY`
3. Copy the **"secret/service_role" key** → This is `SUPABASE_SERVICE_ROLE_KEY`

### 4.3 Set Variables in Vercel

**Using Vercel CLI:**
```bash
vercel env add DATABASE_URL
# Paste your PostgreSQL connection URI when prompted

vercel env add SUPABASE_ANON_KEY
# Paste the anon key when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste the service role key when prompted
```

**Using Vercel Dashboard Web UI:**

1. Go to **Project Settings → Environment Variables**
2. Click "Add New" for each variable:
   - Name: `DATABASE_URL`
   - Value: `postgresql://...` (your connection string)
   - Environments: **Select Both "Production" and "Preview"**
   - Click "Save"

3. Repeat for `SUPABASE_ANON_KEY` (select both Production and Preview)
4. Repeat for `SUPABASE_SERVICE_ROLE_KEY` (select both Production and Preview)

**CRITICAL**: Ensure all three variables are set for BOTH Production AND Preview environments in Vercel.

---

## Step 5: Deploy to Vercel

### Option A: Deploy from Vercel CLI

```bash
vercel deploy --prod
```

### Option B: Deploy from Vercel Dashboard

1. Go to your project on vercel.com
2. Click the "Deployments" tab
3. Click "Deploy" button or push to your main branch (if auto-deploy is enabled)

### Option C: Automatic GitHub Deployment (Auto-Deploy)

Configure automatic deployment from GitHub:

1. **Project Settings → Git → Ignored Build Step** (optional)
2. **Project Settings → Git → Root Directory** (if using monorepo)
3. Push changes to your main/production branch
4. Vercel automatically builds and deploys

---

## Step 6: Verify Deployment Health

### Test Health Endpoint

1. Get your Vercel deployment URL (e.g., `https://my-urllshortener.vercel.app`)

2. Test the health endpoint:
   ```bash
   curl https://your-deployment-url.vercel.app/api/health
   ```

3. **Expected Success Response (200 OK):**
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

4. **If you get 503 Service Unavailable:**
   - See Troubleshooting section below
   - Check environment variables are set correctly
   - Verify database credentials match Supabase

---

## Step 7: Test Business Endpoints

### 7.1 Create a Short URL

```bash
curl -X POST https://your-url.vercel.app/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "destination_url": "https://example.com/very/long/url",
    "custom_code": "optional-code"
  }'
```

Expected response:
```json
{
  "code": "abc123",
  "short_url": "https://your-url.vercel.app/abc123",
  "destination_url": "https://example.com/very/long/url"
}
```

### 7.2 Test Redirect

Visit `https://your-url.vercel.app/abc123` in a browser → Should redirect to the destination URL

### 7.3 Access Dashboard (if implemented)

Visit `https://your-url.vercel.app/dashboard` in a browser → Should display analytics dashboard

---

## Troubleshooting

### Issue: "Build succeeded but health endpoint returns 503"

**Diagnosis:**
1. Check Vercel build logs for errors
2. Test environment variables in Vercel UI

**Solutions:**

- [ ] Verify all 3 env vars are set in **Vercel Project Settings → Environment Variables**
- [ ] Check env vars are marked for **BOTH Production AND Preview** environments
- [ ] **Redeploy the application** after setting variables (new deployment needed for env changes)
  ```bash
  vercel deploy --prod
  ```
- [ ] Use `vercel env ls` to list all environment variables and verify they exist
- [ ] Check Vercel deployment logs for specific error messages

### Issue: "DATABASE_URL value is empty despite being set in Vercel"

**Diagnosis:**
- Environment variable exists but value is not being read

**Solutions:**

- [ ] Verify exact format in Vercel UI matches Supabase:
  - Must start with `postgresql://` or `postgres://`
  - Must include password
  - Format: `postgresql://user:password@host:5432/database`
- [ ] **Do NOT use quotes** in Vercel UI around the value
- [ ] Check for accidental spaces at the beginning or end of the value
- [ ] Copy directly from Supabase without modifications

### Issue: "Connection refused to database"

**Diagnosis:**
- Database credentials are invalid or database is not accessible

**Solutions:**

- [ ] Verify Supabase project is **active (not paused)**
  - Go to Supabase Dashboard → Project Settings → General
  - Check project status
- [ ] Test connection from your local machine:
  ```bash
  # Copy DATABASE_URL from Vercel or Supabase
  export DATABASE_URL="postgresql://..."
  psql $DATABASE_URL -c "SELECT 1"  # Should return "1"
  ```
- [ ] Verify password is correct by looking in Supabase Dashboard
- [ ] Check IP allowlist in Supabase (if configured) — Vercel IPs must be allowed
- [ ] Verify Supabase region is correct in connection string

### Issue: "Deployment stuck in unhealthy state"

**Diagnosis:**
- Multiple issues preventing health check from passing

**Solutions:**

- [ ] Check Vercel deployment logs:
  ```bash
  vercel logs --tail
  ```
- [ ] Look for "CRITICAL" messages about configuration errors
- [ ] Use the health endpoint to see detailed error messages:
  ```bash
  curl https://your-url.vercel.app/api/health | jq . # Pretty-print JSON
  ```
- [ ] Review error `code` and `hint` fields for actionable guidance
- [ ] Verify all 3 required variables are present and have correct values

### Issue: "Preview deployment works but Production does not"

**Diagnosis:**
- Different environment variables between Production and Preview

**Solutions:**

- [ ] Check if you're using different Supabase projects for Production and Preview
- [ ] **Set the SAME environment variables for BOTH Production and Preview** in Vercel:
  ```bash
  vercel env add DATABASE_URL --environments production preview
  vercel env add SUPABASE_ANON_KEY --environments production preview
  vercel env add SUPABASE_SERVICE_ROLE_KEY --environments production preview
  ```
- [ ] If you intentionally want different databases:
  - Production: Points to one Supabase project
  - Preview: Points to another Supabase project
  - Ensure BOTH projects are active and accessible
  - Verify credentials for both in Vercel UI
- [ ] Redeploy both Production and Preview after fixing env variables

### Still Having Issues?

1. Get your **Deployment ID** from Vercel:
   ```bash
   vercel list  # Shows recent deployments
   ```

2. Check the **Vercel build logs**:
   ```bash
   vercel logs --deployment=<deployment-id> --tail
   ```

3. Check the **Supabase status page**:
   - https://status.supabase.com
   - Verify the region your project is in is operational

4. Review the **health endpoint response** for detailed error messages:
   ```bash
   curl https://your-url.vercel.app/api/health | jq .
   ```

---

## Environment Variables Reference

| Variable | Purpose | Format Example | Environments |
|----------|---------|---|---|
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://user:pass@host:5432/db` | Production + Preview |
| `SUPABASE_ANON_KEY` | Public API key (client-safe) | `eyJhbGciOiJIUzI1NiIs...` (base64) | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side API key (secret) | `eyJhbGciOiJIUzI1NiIs...` (base64) | Production + Preview |

**IMPORTANT**: Never commit these values to git. They are secrets and should only be in:
- Vercel Environment Variables (secure, encrypted)
- `.env.local` file (never committed to git)
- CI/CD system secrets (if using)

---

## Next Steps

1. ✅ Verify health endpoint returns 200
2. ✅ Test creating a short URL
3. ✅ Test redirect functionality
4. ✅ Set up monitoring/alerts (optional)
5. ✅ Configure domain name (optional)

---

## Support & Escalation

If deployment continues to fail after following this guide:

1. Collect error messages from:
   - Vercel deployment logs
   - Health endpoint response
   - Application logs

2. Contact support with:
   - Exact error messages
   - Steps you've taken to troubleshoot
   - Vercel project name and deployment IDs

---

**Questions?** See the [Vercel Documentation](https://vercel.com/docs) and [Supabase Documentation](https://supabase.com/docs)

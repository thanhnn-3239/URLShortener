# Quickstart: Deploy URL Shortener to Vercel + Supabase

**Phase**: 1 - Design
**Date**: 2026-04-15
**Audience**: Platform operators, DevOps engineers, first-time deployers

---

## Overview

This guide walks through deploying the URL Shortener application to Vercel with Supabase PostgreSQL in production. It covers environment configuration, deployment steps, and post-deployment verification.

**Estimated Time**: 15-25 minutes
**Prerequisites**: Vercel account, Supabase project, GitHub repository

---

## Pre-Deployment Checklist

Before you start, gather:

- [ ] **Supabase Project URL**: From Supabase Dashboard → Project Settings → API
- [ ] **Supabase Anon Key**: From Supabase Dashboard → Project Settings → API → `anon` key
- [ ] **Supabase Service Role Key**: From Supabase Dashboard → Project Settings → API → `service_role` key
- [ ] **Database Connection String**: From Supabase Dashboard → Project Settings → Database → Connection info

---

## Step 1: Prepare Your Repository

### 1.1 Ensure Code is Ready

```bash
# In your local repository
git status
# Should show no uncommitted changes or feature branch ready

git log --oneline -5
# Verify latest commit is what you want to deploy
```

### 1.2 Verify Environment Config Files (Local Only)

Check your `.env.local` (never committed) has working values:

```bash
# .env.local (LOCAL DEVELOPMENT ONLY - not committed to repo)
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**DO NOT commit `.env.local` or any secrets to repository.**

---

## Step 2: Create or Link Vercel Project

### 2.1 Option A: Link Existing Vercel Project

```bash
# If you already have a Vercel project for this repo
vercel link

# Select the existing project when prompted
```

### 2.2 Option B: Create New Vercel Project

```bash
# Create new project
vercel

# Follow prompts:
# - Link to existing project? → No
# - What's your project's name? → urlshortener
# - In which directory is your code? → . (current)
# - Want to modify project settings? → Yes
```

---

## Step 3: Configure Environment Variables in Vercel

### 3.1 Access Vercel Project Settings

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**
2. Click your project (or create new)
3. Navigate to **Settings** → **Environment Variables**

### 3.2 Add Required Variables

For each variable below, click **"Add New"** and fill:

#### Variable 1: DATABASE_URL

| Field | Value |
|-------|-------|
| **Name** | `DATABASE_URL` |
| **Value** | From Supabase: Project Settings → Database → Connection info → Connection string |
| **Environments** | ✓ Production ✓ Preview ✓ Development |

**Example value** (replace with your actual credentials):
```
postgresql://postgres.jnxyzabc:password123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Where to find in Supabase**:
1. Go to **Supabase Dashboard**
2. Select your project
3. Click **Settings** (bottom left)
4. Click **Database**
5. Look for **Connection string** section
6. Copy the `postgresql://` URI (ensure pooler is selected if available)

#### Variable 2: SUPABASE_ANON_KEY

| Field | Value |
|-------|-------|
| **Name** | `SUPABASE_ANON_KEY` |
| **Value** | From Supabase: Project Settings → API → `anon` public key |
| **Environments** | ✓ Production ✓ Preview ✓ Development |

**Where to find in Supabase**:
1. Go to **Supabase Dashboard**
2. Select your project
3. Click **Settings** (bottom left)
4. Click **API**
5. Copy `anon` public key (long string starting with `eyJhbGc...`)

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY

| Field | Value |
|-------|-------|
| **Name** | `SUPABASE_SERVICE_ROLE_KEY` |
| **Value** | From Supabase: Project Settings → API → `service_role` secret key |
| **Environments** | ✓ Production ✓ Preview ✓ Development |

**Where to find in Supabase**:
1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Copy `service_role` secret key (similar format to anon key)

### 3.3 Verify Environment Variables are Saved

1. Scroll down in **Environment Variables** section
2. You should see 3 rows:
   - DATABASE_URL (for Production, Preview, Development)
   - SUPABASE_ANON_KEY (for Production, Preview, Development)
   - SUPABASE_SERVICE_ROLE_KEY (for Production, Preview, Development)

**✓ All checkmarks should be visible** for Production and Preview columns.

---

## Step 4: Deploy to Vercel

### 4.1 Deploy via GitHub (Auto-Deploy)

If your repo is connected to GitHub:

1. Go to **Vercel Dashboard** → Your project
2. Click **Deployments** tab
3. You should see recent commits
4. Click **Deploy** on the latest commit
5. Wait for build to complete (2-5 minutes)

**If deployment fails**, check:
- [ ] All 3 environment variables are set
- [ ] Values are non-empty and correct format
- [ ] Build logs show specific error (scroll down to see)

### 4.2 Deploy via CLI

If you prefer command-line deployment:

```bash
# From your project root
cd /path/to/URLShortener

# Deploy (will use env vars from Vercel project settings)
vercel deploy --prod

# Output will show deployment URL:
# ✓ Deployed to https://your-project-prod.vercel.app
```

---

## Step 5: Verify Deployment Health

### 5.1 Check Health Endpoint

Once deployment completes, test the health check:

```bash
# Replace with your actual Vercel URL
curl https://your-project-prod.vercel.app/api/health

# Expected response (if healthy):
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

**If you get a 503 response**, see the **Troubleshooting** section below.

### 5.2 Check Vercel Health Dashboard

1. Go to **Vercel Dashboard** → Your project
2. Look for **Health** status indicator near deployment info
3. Should show **🟢 Healthy**

If **🔴 Unhealthy**:
- [ ] Scroll down to see health check failures
- [ ] Check `/api/health` response for error details
- [ ] Fix issues and redeploy

### 5.3 Manual Verification Checklist

After health check passes, verify main features:

#### Test: Create Short URL

```bash
curl -X POST https://your-project-prod.vercel.app/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://example.com"}'

# Expected response:
{
  "shortCode": "abc123",
  "shortenedUrl": "https://your-project-prod.vercel.app/abc123",
  "originalUrl": "https://example.com"
}
```

#### Test: Redirect

```bash
# Should redirect to example.com
curl -L https://your-project-prod.vercel.app/abc123 -v

# Look for 301/302 redirect header
# Location: https://example.com
```

#### Test: View Dashboard

```bash
# Open in browser
https://your-project-prod.vercel.app/dashboard

# Should load without errors
# May show analytics for previously created links
```

---

## Step 6: Enable Automatic Health Checks (Optional)

Vercel can automatically check `/api/health` regularly:

1. Go to **Vercel Dashboard** → Your project → **Settings**
2. Scroll to **Deployments** → **Health Check** section
3. Enable: **✓ Enable Health Check**
4. Path: `/api/health`
5. Timeout: `10 seconds`
6. Save

Now Vercel will automatically check every 60 seconds and alert if deployment becomes unhealthy.

---

## Step 7: Set Up Monitoring Alerts (Optional)

In **Vercel Dashboard** → **Settings** → **Notifications**:

- [ ] Enable **Deployment** notifications
- [ ] Enable **Health Check** notifications
- [ ] Add email or Slack webhook to receive alerts

---

## Troubleshooting

### Problem: Health Check Returns 503

#### Error: "MISSING_DATABASE_URL"

**Cause**: `DATABASE_URL` environment variable not set in Vercel

**Solution**:
1. Go to **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` row exists
3. Check value is not empty
4. Check ✓ marks in **Production** and **Preview** columns
5. **Redeploy**: Click deployment and select **Redeploy**

```bash
# Or via CLI:
vercel deploy --prod --yes
```

---

#### Error: "INVALID_DATABASE_URL_FORMAT"

**Cause**: `DATABASE_URL` value doesn't match PostgreSQL URL pattern

**Solution**:
1. Get correct value from **Supabase Dashboard** → **Settings** → **Database**
2. Should start with `postgresql://`
3. Should include username, password, host, port, database name
4. Copy full connection string, paste into Vercel environment variable
5. Redeploy

**Common mistake**: Copying only the host part; missing the connection string prefix.

---

#### Error: "DATABASE_CONNECTION_FAILED"

**Cause**: Database URL is set but credentials are incorrect or network is down

**Solution**:

1. **Verify credentials**:
   ```bash
   # Test locally (in local terminal)
   psql "postgresql://user:password@db.supabase.co:5432/postgres"

   # If this fails, password or user is wrong
   ```

2. **Check Supabase status**:
   - Go to [Supabase Status Page](https://status.supabase.com)
   - Verify PostgreSQL region is operational

3. **Verify IP allowlist** (if applicable):
   - Supabase → Project Settings → Network
   - Ensure Vercel deployment region is allowed

4. **Redeploy** after fixing credentials:
   ```bash
   vercel deploy --prod --yes
   ```

---

#### Error: "MISSING_SUPABASE_KEY" or similar auth errors

**Cause**: `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` not set

**Solution**:
1. Go to **Vercel** → Project Settings → Environment Variables
2. Add the missing key from **Supabase** → **Settings** → **API**
3. Ensure ✓ marks are set for **Production** and **Preview**
4. Redeploy

---

### Problem: Deployment Builds Successfully, But 503 After Deployment

**Cause**: Build succeeded (env not needed for build), but runtime validation failed

**Solution**:
1. Click the failed deployment in Vercel
2. Scroll to **Runtime logs** section
3. Look for error messages mentioning `DATABASE_URL` or env variables
4. Compare with Supabase credentials
5. Fix environment variable value
6. Redeploy

---

### Problem: Health Check Passes, But Shorten/Redirect Returns 500

**Cause**: Possible database permission issue or unexpected error

**Solution**:
1. Check Vercel **Function logs** for detailed error message
2. Verify database user has sufficient permissions for:
   - Reading `short_urls` table
   - Writing to `short_urls` table
   - Recording clicks in analytics
3. Check Supabase database structure:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM short_urls LIMIT 1;  -- Should return rows or empty result
   ```
4. If tables missing, run migration script (contact development team)

---

### Problem: Environment Variables Set, But Not Appearing in Vercel Dashboard

**Cause**: Possible race condition or cache issue

**Solution**:
1. Hard refresh Vercel page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Wait 30 seconds, then reload
3. Check different tab: **Settings** → **Environment Variables**
4. If still not appearing, remove and re-add the variable

---

## Rollback to Previous Deployment

If the new deployment is broken and you need to revert:

1. Go to **Vercel Dashboard** → **Deployments**
2. Find the previous successful deployment (✓ Successful)
3. Click **...** menu → **Promote to Production**

This makes the previous version active again while you fix issues.

---

## Maintenance & Ongoing Checks

After successful deployment:

1. **Monitor Health** (daily):
   - Check `/api/health` endpoint
   - Review Vercel Dashboard for any 🔴 red status

2. **Check Logs** (weekly):
   - Vercel Function logs for any errors
   - Supabase database activity

3. **Update Credentials** (if password changed):
   - Update `DATABASE_URL` in Vercel environment variables
   - Redeploy all environments

4. **Scale as Needed**:
   - Monitor request count
   - If needed, upgrade Supabase plan for more connections

---

## Getting Help

If you're stuck:

1. **Check this guide's Troubleshooting section** (above)
2. **View Vercel logs**:
   - Vercel Dashboard → Deployments → Click failed deployment → Runtime logs
3. **View Supabase status**:
   - https://status.supabase.com
4. **Contact support**:
   - Include: Vercel deployment URL, `/api/health` response, error message from logs

---

## Summary

✓ Environment variables prepared and saved in Vercel
✓ Deployment completed successfully
✓ Health endpoint returns 200 OK
✓ Main features (shorten, redirect, dashboard) verified
✓ Monitoring alerts configured (optional)

**Your URL Shortener is now live on Vercel + Supabase!**

---

# Deployment Checklist

## Build and Runtime

- [x] Production image builds successfully
  - `docker build -t url-shortener:latest .`
- [x] Production container runs locally
  - `docker run -d --name url-shortener-prod-test -p 3002:3000 url-shortener:latest`
- [x] Health endpoint responds in container
  - `GET /api/health` -> `200` and `{ "status": "ok" }`
- [x] Next.js production build succeeds
  - `npm run build`

## Required Environment Variables

- [x] `DATABASE_URL`
- [x] `NEXT_PUBLIC_SHORT_URL_BASE`
- [x] `SHORT_CODE_LENGTH`
- [x] `CORS_ALLOW_ORIGIN`
- [x] `ENABLE_SHORTEN_RATE_LIMIT` (optional)

Reference: `.env.example`

## Database and Operations

- [ ] Configure automated Postgres backups
- [ ] Configure error monitoring/alerting
- [ ] Configure log retention policy
- [ ] Confirm materialized view refresh schedule

## Security

- [x] CORS headers configured for API routes
- [x] Security headers configured (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`)
- [x] URL validation rejects non-http(s) schemes
- [x] Sensitive log fields are redacted
- [x] Optional rate limiting available for `/api/shorten`

## Verification Commands

```bash
npm run lint
npm run tsc
npm run test
npm run build
docker compose up -d --build
docker build -t url-shortener:latest .
```

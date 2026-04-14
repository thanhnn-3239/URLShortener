# Quickstart: URL Shortener with Click Analytics

**Date**: 2026-04-13 | **Branch**: 001-add-url-click-analytics

This quickstart is aligned with the current repository scripts and runtime behavior.

## Prerequisites

- Node.js 18+
- npm 9+
- Docker + Docker Compose

## 1) Install dependencies

```bash
npm install
```

## 2) Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 3) Run with Docker

```bash
docker compose up -d --build
```

Smoke check:

```bash
curl -i http://localhost:3000/
curl -i http://localhost:3000/api/health
```

Expected: both return `200`.

## 4) Verify implementation gate (recommended)

```bash
npm run verify:impl
```

This command validates:

1. `npm run lint`
2. `npm run tsc`
3. `npm run test`
4. `docker compose up -d --build`
5. URL smoke checks for `/` and `/api/health`

## 5) API quick test

Create short URL:

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"destination_url":"https://example.com/long-url"}'
```

Open dashboard:

```bash
curl "http://localhost:3000/api/dashboard?groupBy=daily"
```

Force dashboard materialized-view refresh:

```bash
curl "http://localhost:3000/api/dashboard?refresh=1"
```

## 6) Test commands

```bash
npm run test
npm run test:coverage
```

## 7) Project references

- API docs: `docs/API.md`
- OpenAPI spec: `docs/openapi.yaml`
- Contracts: `specs/001-url-click-analytics/contracts/`

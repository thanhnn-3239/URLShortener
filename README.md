# URL Shortener with Click Analytics

A full-stack Next.js application that lets users create short URLs, redirect traffic, and track click analytics.

## Features

- Create short URLs via `POST /api/shorten`
- Redirect short codes via `GET /api/redirect/[code]`
- Per-link analytics via `GET /api/analytics/[code]`
- Dashboard analytics via `GET /api/dashboard`
- Click source/device classification and trend insights
- 5-minute dashboard response caching
- On-demand materialized-view refresh (`refresh=1`)

## Tech Stack

- Next.js 14 + React 18 + TypeScript
- TailwindCSS
- Vitest + React Testing Library
- Docker Compose for local stack

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Docker + Docker Compose

### Install

```bash
npm install
```

### Run locally (dev)

```bash
npm run dev
```

App is available at `http://localhost:3000`.

### Run with Docker

```bash
docker compose up -d --build
```

### Verify implementation gate

```bash
npm run verify:impl
```

This gate runs:

1. `npm run lint`
2. `npm run tsc`
3. `npm run test`
4. `docker compose up -d --build`
5. Smoke checks for `/` and `/api/health`

## Useful Commands

```bash
npm run lint
npm run tsc
npm run test
npm run test:coverage
npm run format
```

## API Documentation

- Human-readable API summary: `docs/API.md`
- OpenAPI spec: `docs/openapi.yaml`
- Feature contracts: `specs/001-url-click-analytics/contracts/`

## Project Structure

```text
app/          # pages + API routes
components/   # UI components
lib/          # shared utilities
services/     # business logic
sql/          # schema and views
tests/        # unit/contract/integration/component tests
```

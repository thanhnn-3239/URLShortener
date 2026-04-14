# API Reference

Base URL (local): `http://localhost:3000`

## Health

### GET /api/health

Returns service health.

Response `200`:

```json
{ "status": "ok" }
```

## Shorten URL

### POST /api/shorten

Create a short URL.

Request body:

```json
{
  "destination_url": "https://example.com/page"
}
```

Response `201`:

```json
{
  "id": "...",
  "code": "abc123",
  "short_url": "http://localhost:3000/abc123",
  "destination_url": "https://example.com/page",
  "created_at": "2026-04-13T00:00:00.000Z",
  "expires_at": null
}
```

## Redirect

### GET /api/redirect/{code}

Redirects to the destination URL and records click analytics.

Response `302`:

- `Location: <destination_url>`

Response `404`:

```json
{
  "error": "not_found",
  "message": "Short URL not found",
  "timestamp": "..."
}
```

## Per-link Analytics

### GET /api/analytics/{code}

Query params:

- `start_date` (optional, `YYYY-MM-DD`)
- `end_date` (optional, `YYYY-MM-DD`)

Response `200` includes totals, source/device breakdown, daily trend, and consistency metrics.

## Dashboard Analytics

### GET /api/dashboard

Query params:

- `startDate` (optional, `YYYY-MM-DD`, default: last 30 days)
- `endDate` (optional, `YYYY-MM-DD`, default: today)
- `groupBy` (optional, `daily|weekly`, default: `daily`)
- `refresh` (optional, `1|true|yes`) to force materialized-view refresh

Response `200`:

- `dailyTrends`
- `weeklyTrends`
- `topLinks`
- `insights`
- `totalClicks`
- `dateRange`

Response `400` for invalid dates/grouping.

Response `500` for server-side failures.

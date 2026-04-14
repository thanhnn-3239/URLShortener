# Performance Validation

Date: 2026-04-14

## Budgets

- Redirect latency (T090): p95 < 50ms cold, < 10ms warm
- Dashboard load (T091): p95 < 3000ms for 30-day range
- Analytics accuracy (T092): difference < 1%
- Main app bundle (T093): < 200KB first load JS

## Measured Results

### Redirect and Dashboard (sequential benchmark)

Measured via Node fetch benchmark against both local and Docker deployments.

- Local (`http://localhost:3001`)
  - Redirect cold p95: 37.15ms
  - Redirect warm p95: 18.23ms
  - Dashboard p95 (30-day): 13.29ms
- Docker (`http://localhost:3000`)
  - Redirect cold p95: 36.81ms
  - Redirect warm p95: 22.36ms
  - Dashboard p95 (30-day): 13.08ms

Status:

- Cold redirect budget: PASS
- Warm redirect budget: FAIL (above 10ms in this environment)
- Dashboard budget: PASS

### Analytics Accuracy

Sample run after 120 redirects:

- `total_clicks`: 120
- consistency difference: 0
- consistency ratio: 0
- withinTolerance: true

Status: PASS

### Bundle Size

From `npm run build`:

- `/` first load JS: 90kB
- `/dashboard` first load JS: 92kB
- Shared first load JS: 87.4kB

Status: PASS

### Query Performance and Index Usage

Validated with Postgres `EXPLAIN ANALYZE`:

- `click_events` date-range query uses `idx_click_events_short_link_id_clicked_at`
- `short_links` query is index-backed by `idx_short_links_code` / unique constraint on `code`
- No N+1 pattern in service-layer dashboard aggregation (single-table fetch and in-memory aggregate)

Status: PASS

### Load Test (T106)

Command used:

- `npx autocannon -c 1000 -a 1000 GET /api/redirect/{code}` against production container on port `3002`

Observed:

- Average latency: 1679.22ms
- p99 latency: 2824ms
- Throughput: 333 req/sec

Status: FAIL in current local test environment

## Summary

- Passed: dashboard, bundle size, analytics accuracy, DB query/index checks
- Not fully met: warm redirect p95 < 10ms and 1000-concurrency < 50ms in local environment

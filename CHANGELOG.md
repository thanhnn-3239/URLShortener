# Changelog

## v1.0.0 - 2026-04-14

### Added

- URL shortener core APIs: create, redirect, health, analytics, dashboard
- Click tracking with source/device classification
- Dashboard caching and materialized-view refresh support
- Request logging middleware and structured API logs
- Security middleware headers and CORS support
- Optional in-memory rate limiting for `/api/shorten`
- Performance and deployment validation docs

### Changed

- Database adapter supports runtime PostgreSQL with in-memory fallback for tests
- Dashboard page uses dynamic component loading to reduce first-load bundle size
- Logger now redacts sensitive fields (`token`, `password`, `ip`, etc.)

### Testing

- Full suite passing: 25 test files, 128 tests
- Added coverage for malformed JSON, empty route params, dashboard UX states, validation edge cases

### Notes

- Some high-concurrency latency targets remain environment-dependent and are tracked in `DEVIATIONS.md`

# Plan Deviations

Date: 2026-04-14

## Deviation 1: 1000-concurrency redirect latency target

- Plan target: `<50ms` redirect latency under 1000 concurrent requests
- Current result (local production-container benchmark): p99 ~2824ms, avg ~1679ms
- Impact: performance budget is not met in local environment
- Rationale:
  - Test environment is a single local container without horizontal scaling
  - 1000 simultaneous connections saturate event loop and connection queue
- Follow-up:
  - Re-test in production-like infra with autoscaling and load balancer
  - Add connection pooling tuning and load-shedding policy if required

## Deviation 2: Warm redirect p95 threshold

- Plan target: warm p95 `<10ms`
- Current result: warm p95 ~18-22ms
- Impact: misses strict threshold by ~8-12ms in current setup
- Rationale:
  - Includes end-to-end HTTP overhead in local benchmark
  - Runtime still performs click tracking writes during redirect
- Follow-up:
  - Re-measure with server-side timing probes and optimized write path
  - Consider async/offloaded click write path for hot redirects

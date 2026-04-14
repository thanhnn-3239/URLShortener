# Research: URL Shortener with Click Analytics

**Date**: 2026-04-13 | **Branch**: 001-add-url-click-analytics | **Status**: Complete

## Context

This research document captures technology decisions and findings for the URL Shortener with Click Analytics feature. All decisions align with user preferences (Next.js, TypeScript, Supabase, Vercel/CloudFlare deployment) and constitutional requirements (Code Quality, Testing, UX Consistency, Performance, Maintainability).

---

## Research Findings

### 1. Framework Choice: Next.js 14+ (Full-Stack TypeScript)

**Decision**: Use Next.js 14 with App Router for unified frontend + backend development.

**Rationale**:

- Eliminates separation between backend and frontend codebases; single deployment unit
- App Router enables file-based routing for both pages and API routes
- Native TypeScript support with excellent type inference
- Compatible with both Vercel and CloudFlare Workers deployments
- Mature ecosystem for analytics dashboards (React charting libraries)

**Alternatives Considered**:

- Express.js + React SPA (requires separate build/deployment, more operational overhead)
- Remix (good alternative, but Next.js has larger community and more dashboard UI libraries)
- Svelte/SvelteKit (equally capable, but TypeScript ecosystem less mature for this problem domain)

**Implementation Impact**: Single `package.json`, unified CI/CD pipeline, shared TypeScript types between API and frontend.

---

### 2. Database: Supabase PostgreSQL

**Decision**: Use Supabase (managed PostgreSQL + auth + real-time APIs).

**Rationale**:

- PostgreSQL is industry-standard for analytics workloads (native window functions, materialized views)
- Supabase provides managed infrastructure (vs. self-hosted), reducing operational burden
- Built-in Row-Level Security (RLS) enforces data boundaries at database level
- Real-time subscriptions available (future enhancement for live analytics)
- Simplified connection pooling with PgBouncer (included in Supabase)

**Alternatives Considered**:

- MongoDB (JSON-flexible, but poor aggregation performance for analytics; less suitable for click event counting)
- DynamoDB (serverless on AWS, but limited aggregation capabilities; overkill for scale of 1M clicks/day)
- Firestore (Firebase, good real-time, but limited aggregation pipeline; higher cost at scale)

**Implementation Impact**: PostgreSQL schema design with click_events and short_links tables; materialized views for daily/weekly aggregation; RLS policy templates for future multi-tenancy.

---

### 3. Deployment: Vercel (Primary) + CloudFlare Workers (Secondary)

**Decision**: Primary deployment on Vercel; CloudFlare Workers for optional edge-optimized redirect serving.

**Rationale**:

- Vercel is the canonical Next.js deployment platform (zero-config, native support)
- Auto-scaling handles traffic spikes (critical for redirect requests)
- Edge functions for redirect responses can use CloudFlare Workers (optional optimization)
- Both support serverless PostgreSQL connections via connection pooling
- Environment variable management built-in

**Alternatives Considered**:

- AWS Lambda + API Gateway (powerful but more configuration required; longer cold starts)
- Railway.app or Render (good alternatives, but Vercel has better Next.js integration)
- Self-hosted on VPS (reduces cost but increases operational overhead significantly)

**Implementation Impact**: `vercel.json` configuration; environment variables in Vercel dashboard; optional separate CloudFlare Workers project for redirects (if performance requires).

---

### 4. Testing Strategy: Vitest + React Testing Library + Supertest

**Decision**: Use Vitest for unit tests, React Testing Library for component tests, Supertest for API integration tests.

**Rationale**:

- Vitest is modern TypeScript test runner, faster than Jest, native ESM support
- React Testing Library encourages testing component behavior (not implementation)
- Supertest is minimal, focused HTTP assertion library for API endpoint testing
- All three maintain file co-location with source (`*.test.ts`, `*.test.tsx`)

**Alternatives Considered**:

- Jest (heavier, but still good; Vitest chosen for speed and ESM support)
- Playwright E2E tests (future consideration for full browser automation)

**Implementation Impact**: `vitest.config.ts` at project root; test files adjacent to source code.

---

### 5. Frontend Styling: TailwindCSS

**Decision**: Use TailwindCSS for rapid, consistent UI development.

**Rationale**:

- Utility-first approach speeds up component styling
- Pre-built component libraries available (Headless UI, Shadcn/ui)
- Excellent accessibility plugins (text contrast, focus states)
- Works seamlessly with Next.js and TypeScript

**Alternatives Considered**:

- CSS Modules (good, but requires more manual consistency work)
- CSS-in-JS libraries (styled-components, emotion; more runtime overhead)

**Implementation Impact**: `tailwind.config.js` configuration; component library selection (Shadcn/ui recommended for input forms, charts).

---

### 6. Short URL Encoding: Base62 (Custom Generator)

**Decision**: Implement custom Base62 short code generator (vs. UUID nanoid/ulid).

**Rationale**:

- Short codes should be human-friendly and short (6-8 characters sufficient for millions)
- Base62 (0-9, a-z, A-Z) maximizes entropy in minimum character count
- Collision handling via database uniqueness constraint + retry logic
- Deterministic generation (no dependency on external library)

**Alternatives Considered**:

- nanoid library (good, but adds dependency; custom implementation simpler)
- UUID (too long for user-friendly sharing)
- Sequential IDs with hashing (still requires collision handling)

**Implementation Impact**: `lib/validation.ts` will include `generateShortCode()` function; database has unique constraint on `code` column.

---

### 7. Click Event Attribution: Simplified Device + Source

**Decision**: Classify devices into categories (mobile, desktop, tablet, unknown) using regex patterns on User-Agent header; source from Referer header.

**Rationale**:

- User-Agent parsing is standard, privacy-respecting (client-side sent header)
- No external geolocation APIs required (cost, privacy concerns)
- Referer header often available from direct links, social shares (good signal for source)
- Simplified categories sufficient for initial product (detailed device fingerprinting deferred)

**Alternatives Considered**:

- MaxMind GeoIP database (cost, privacy concerns, deferred to Phase 2)
- Full User-Agent parsing library (overkill for current needs)
- Analytics pixel tracking (additional JavaScript injection; more invasive)

**Implementation Impact**: `services/clickTracking.ts` includes `parseDeviceSource()` function; fallback to "unknown" for unresolvable values.

---

### 8. Analytics Aggregation: Materialized Views + Query-Time Rollup

**Decision**: Use PostgreSQL materialized views for daily/weekly aggregation; refresh on click event insertion (via trigger or batch job).

**Rationale**:

- Materialized views pre-compute expensive aggregations (GROUP BY timestamp, code, device, source)
- Dashboard queries hit pre-computed views (sub-second response, <3s load time achievable)
- Batch refresh (nightly or real-time triggers) balances freshness and performance
- PostgreSQL native approach (no need for external caching layer)

**Alternatives Considered**:

- Redis caching (adds operational complexity, eventual consistency risks)
- Application-level caching (slower, harder to invalidate correctly)

**Implementation Impact**: `sql/views.sql` defines materialized views; `services/analytics.ts` includes refresh logic.

---

## Decisions Summary

| Technology            | Decision                                   | Status       |
| --------------------- | ------------------------------------------ | ------------ |
| Language              | TypeScript + Node.js 18 LTS                | ✅ Confirmed |
| Frontend/Backend      | Next.js 14 App Router                      | ✅ Confirmed |
| Database              | Supabase PostgreSQL                        | ✅ Confirmed |
| Deployment Primary    | Vercel                                     | ✅ Confirmed |
| Deployment Secondary  | CloudFlare Workers (optional)              | ✅ Confirmed |
| Testing               | Vitest + React Testing Library + Supertest | ✅ Confirmed |
| Styling               | TailwindCSS                                | ✅ Confirmed |
| Short Code            | Base62 Custom Generator                    | ✅ Confirmed |
| Device Classification | User-Agent parsing regex                   | ✅ Confirmed |
| Analytics             | PostgreSQL Materialized Views              | ✅ Confirmed |

**Constitutional Compliance**:

- ✅ Code Quality: TypeScript enforces interfaces; modular service layer
- ✅ Testing: Comprehensive test strategy defined (unit, integration, component, E2E)
- ✅ UX Consistency: TailwindCSS and component library ensure consistent styling
- ✅ Performance: Materialized views, connection pooling, edge deployment all support budgets
- ✅ Maintainability: Simplified architecture, no premature abstraction, focus on clarity

---

## Next Steps

**Proceed to Phase 1**:

1. Generate `data-model.md` with detailed schema and entity definitions
2. Create `contracts/` directory with API request/response schemas
3. Generate `quickstart.md` with local development setup
4. Update agent context with technology stack
5. Re-evaluate Constitution Check post-design

**No blockers identified.** All research complete; ready for design phase.

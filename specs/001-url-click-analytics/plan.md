# Implementation Plan: URL Shortener with Click Analytics

**Branch**: `001-add-url-click-analytics` | **Date**: 2026-04-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-url-click-analytics/spec.md`
**Technology Stack**: Next.js (FullStack), TypeScript, Supabase, Vercel/CloudFlare Workers

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

The URL Shortener with Click Analytics feature provides users with: (1) ability to shorten URLs and share them, (2) automated click tracking with source and device classification, and (3) analytics dashboard showing trends by day/week and ranked top links. This implements a P1 foundation (URL creation/redirection) + P2 analytics core (click tracking) + P3 reporting (dashboard and trends), satisfying core product requirements with measurable success criteria (95% first-attempt success, 99% redirect accuracy, <3s dashboard load, 90% user satisfaction).

Technical approach: Full-stack TypeScript with Next.js API routes for backend logic, Supabase PostgreSQL for persistent storage and analytics aggregation, and modern React frontend for dashboard UX. Deployment targets Vercel for immediate time-to-market with CloudFlare Workers as secondary option for edge-optimized redirect serving.

## Technical Context

**Language/Version**: TypeScript 5.2+, Node.js 18+ (via Next.js LTS)
**Primary Dependencies**: Next.js 14+, Supabase SDK, React 18+, TailwindCSS, Vitest/Jest, React Testing Library
**Storage**: Supabase PostgreSQL (managed database for short links, click events, view materialization)
**Testing**: Vitest (unit), React Testing Library (component), Supertest (API integration)
**Target Platform**: Web (Browser + Server), Vercel or CloudFlare Workers deployment
**Project Type**: Web service (full-stack Next.js application)
**Performance Goals**: 
  - Redirect response time: p95 <50ms for short URL retrieval and redirect
  - Dashboard load: p95 <3s for 30-day date range (from spec SC-004)
  - Analytics accuracy: <1% daily difference between clicks and redirects (from spec SC-003)
  - Throughput: Support 1000+ concurrent short URL creations and 10k+ simultaneous redirect requests
**Constraints**: 
  - Redirect latency <50ms (200-250ms total with cold start acceptable for dashboard)
  - Memory footprint <128MB per serverless function
  - Database connection pooling to manage concurrent analytics writes
**Scale/Scope**: 
  - Initial: 10k-100k short URLs in alpha, <1M clicks/day projected
  - User story coverage: 3 independent, testable slices (P1 create/redirect, P2 click tracking, P3 dashboard)
  - Data modeling: 4 key entities (Short Link, Click Event, Analytics Aggregate, Dashboard View)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality Gate** ✅ PASS
  - Impact: Core modules: API routes for short URL CRUD, redirect handler, click tracking, analytics aggregation
  - Complexity: Moderate (3 logical domains with clear boundaries, no premature abstraction anticipated)
  - Naming/Error Handling: Public API endpoints MUST document request/response schemas and error cases explicitly
  - Design Justification: Modular structure with separation of concerns (data layer via Supabase, business logic in service functions, API routing via Next.js)
  - Verified: No violation of maintainability principle; each module has focused responsibility

- **Testing Gate** ✅ PASS
  - Unit tests required: 
    - Short URL creation validation and encoding logic
    - Click event parsing and device/source classification
    - Analytics aggregation (daily/weekly rollups)
  - Integration tests required:
    - End-to-end redirect flow (API → database → redirect)
    - Click tracking flow (request → event capture → aggregation)
    - Dashboard data consistency (events → aggregates → queries)
  - Regression tests required: 
    - No duplicate click counting on concurrent requests
    - Correct handling of malformed URLs and non-existent short codes
    - Analytics accuracy within 1% tolerance
  - CI strategy: Jest/Vitest for unit, Supertest for API integration, React Testing Library for dashboard components
  - Verified: Tests will be introduced per user story before/during development (PR-level test requirement)

- **UX Consistency Gate** ✅ PASS
  - Affected flows: URL creation form, redirect success/error, analytics dashboard, empty state
  - Required states to define: 
    - Loading: Spinner during URL creation, dashboard data fetch
    - Empty: No analytics data for selected date range, zero click links
    - Success: URL copied to clipboard, redirect completion, dashboard rendered
    - Error: Invalid URL format, short code not found, database errors with user-friendly messages
  - Pattern consistency: Button styles, color scheme, typography aligned with existing product (if exists)
  - Verified: No conflicts with stated assumptions; deferred access control aligns with spec

- **Performance Gate** ✅ PASS
  - Performance budgets (from spec SC-004 and technical context):
    - Redirect p95 latency: <50ms cold, <10ms warm (database query + HTTP redirect)
    - Dashboard load p95: <3s for 30-day aggregation
    - Click write latency: <100ms (async event stream acceptable)
  - Validation method: Load testing under 10k concurrent redirects, dashboard timing with monitoring instrumentation
  - Constraint satisfaction: Supabase connection pooling prevents database bottleneck; Vercel serverless auto-scales
  - Verified: Budgets are measurable and achievable with chosen stack

- **Maintainability Gate** ✅ PASS
  - Simplicity commitment: Use Supabase built-in auth and RLS rather than custom auth; leverage PostgreSQL views/materialized views for aggregation rather than application-level caching
  - Reviewability: Each PR will focus on single user story (P1: redirect, P2: tracking + aggregation, P3: dashboard)
  - Duplication avoidance: Shared service exports for database, error handling, response formatting (minimal duplication)
  - Verified: TypeScript interfaces enforce consistency; reviewed design avoids overengineering

**Gate Evaluation**: All five gates PASS with no violations. Feature is approved to proceed to Phase 0 research.

---

## Post-Design Constitution Re-Check

*Confirm all gates still pass after Phase 1 design completion*

- ✅ **Code Quality**: Data model entities are clearly defined with explicit validation rules and relationships. API contracts include detailed request/response schemas with error handling. No complexity added; design remains simple and focused.

- ✅ **Testing**: Test categories remain well-defined:
  - Unit: URL validation, Base62 encoding, analytics aggregation logic
  - Integration: Redirect flow, click tracking pipeline, dashboard query consistency
  - Component: Form, chart, table, empty state rendering
  - All reflected in services/ and tests/ structure

- ✅ **UX Consistency**: Empty state documented in dashboard contract (zero clicks case). Error responses follow consistent JSON format. States (loading, empty, success, error) explicitly listed in project structure under components/.

- ✅ **Performance**: Materialized views directly address <3s dashboard load requirement. Short URL redirect simple lookup (code → destination_url) stays <50ms. No N+1 queries in contracts.

- ✅ **Maintainability**: Monorepo structure (single Next.js app) eliminates deployment complexity. Supabase RLS and views push aggregation to database (simpler application code). Services layer isolated from API routes (clear separation). No overengineering introduced.

**Re-Check Result**: All gates REMAIN PASSED. Design artifacts (data-model.md, contracts/, quickstart.md) introduce no violations or complexity drift. Approved to proceed to Phase 2 (task generation).

## Project Structure

### Documentation (this feature)

```text
specs/001-url-click-analytics/
├── spec.md              # Feature specification (user stories, requirements, entities)
├── plan.md              # This file (technical context, constitution gates, design decisions)
├── research.md          # Phase 0 output (research findings, technology decisions)
├── data-model.md        # Phase 1 output (entity definitions, relationships, database schema)
├── quickstart.md        # Phase 1 output (developer setup, local development guide)
├── contracts/           # Phase 1 output (API contracts, request/response schemas)
│   ├── short-url-api.md # POST /api/shorten, GET /api/[code]
│   ├── analytics-api.md # GET /api/analytics/[code], GET /api/dashboard
│   └── webhooks.md      # Internal event schemas (if applicable)
├── checklists/
│   └── requirements.md   # Quality validation checklist (passed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Next.js Full-Stack Repository)

```text
.
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── vitest.config.ts
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (dark/light mode, nav)
│   ├── page.tsx                 # Home: POST short URL form
│   ├── dashboard/               # Analytics dashboard pages
│   │   └── page.tsx             # Dashboard with date range picker, trends chart, top links table
│   ├── api/                     # API routes (backend)
│   │   ├── shorten/             # POST /api/shorten (create short URL)
│   │   │   └── route.ts
│   │   ├── redirect/[code]/     # GET /api/redirect/[code] (302 redirect + click tracking)
│   │   │   └── route.ts
│   │   ├── analytics/           # GET /api/analytics endpoints
│   │   │   ├── [code]/route.ts  # GET /api/analytics/[code] (per-link stats)
│   │   │   └── dashboard/route.ts # GET /api/dashboard (daily/weekly aggregates + top links)
│   │   └── health/route.ts      # Health check endpoint
│   └── error.tsx, not-found.tsx # Error boundary pages
│
├── lib/                         # Shared utilities
│   ├── db.ts                    # Supabase client initialization
│   ├── types.ts                 # TypeScript interfaces (ShortLink, ClickEvent, etc.)
│   ├── validation.ts            # URL validation, short code generation
│   ├── errors.ts                # Error classes and handling
│   └── constants.ts             # Configuration constants
│
├── services/                    # Business logic layer
│   ├── shortUrl.ts              # createShortUrl(), resolveShortUrl()
│   ├── clickTracking.ts         # recordClick(), parseDeviceSource()
│   ├── analytics.ts             # getPerLinkStats(), getDashboardData(), aggregateByDay()
│   └── database.ts              # Raw DB queries (select, insert, upsert)
│
├── components/                  # React components
│   ├── ShortenForm.tsx          # Form for URL submission
│   ├── ClickToCopy.tsx          # Copy short URL button
│   ├── DashboardChart.tsx       # Daily/weekly trend visualization
│   ├── TopLinksTable.tsx        # Ranked links by click count
│   ├── DateRangePicker.tsx      # Calendar date range selector
│   └── EmptyState.tsx           # No data fallback UI
│
├── styles/                      # CSS modules or global styles
│   └── globals.css              # TailwindCSS with component overrides
│
├── tests/                       # Test suite
│   ├── unit/
│   │   ├── validation.test.ts   # URL validation logic
│   │   ├── shortUrl.test.ts     # Short code generation, collision handling
│   │   └── analytics.test.ts    # Aggregation logic, accuracy tolerance
│   ├── integration/
│   │   ├── redirect.test.ts     # E2E redirect flow
│   │   ├── tracking.test.ts     # Click tracking pipeline
│   │   └── dashboard.test.ts    # Data consistency (events → aggregates)
│   └── component/
│       ├── ShortenForm.test.tsx # Form submission, error states
│       ├── DashboardChart.test.tsx # Chart rendering with mock data
│       └── TopLinksTable.test.tsx  # Table sorting and filtering
│
├── public/                      # Static assets
│   └── favicon.ico
│
├── sql/                         # Database initialization scripts
│   ├── schema.sql               # Table definitions (short_links, click_events)
│   ├── views.sql                # Materialized views (daily_clicks, top_links)
│   └── migrations.sql           # Future schema changes
│
├── .env.example                 # Environment variables template
└── .env.local                   # (gitignored) Local secrets
```

**Structure Decision**: 
- **Backend**: Next.js API routes (`/app/api/*`) for serverless deployment (Vercel/CloudFlare Workers compatible)
- **Frontend**: Next.js App Router pages and React components (same monorepo, deployed together)
- **Database**: Supabase PostgreSQL with materialized views for fast dashboard aggregations
- **Services layer**: Shared TypeScript functions for business logic (validation, tracking, analytics)
- **Testing**: Vitest (unit/integration) + React Testing Library (components) + Supertest (API)
- **Styling**: TailwindCSS for rapid, consistent UI development
- **No separate backend project needed**: Everything unified in single Next.js app for faster iteration and lower operational burden

**Rationale for structure**:
- Single Next.js project reduces deployment complexity and keeps frontend/backend in sync
- Materialized views in PostgreSQL (rather than application caching) ensure analytics consistency
- Service layer functions keep API routes thin and testable
- TypeScript interfaces enforce contracts between layers
- Supabase RLS (Row-Level Security) enforces data boundaries at database level

## Complexity Tracking

> **No violations identified**: All Constitution Check gates passed. This section documents design trade-offs that maintain simplicity while satisfying performance and functionality requirements.

| Deliberate Choice | Justification | Alternative Not Chosen |
|---|---|---|
| Single Next.js monorepo (no separate backend) | Reduces deployment complexity, keeps FE/BE in sync, faster iteration | Microservices (would increase operational burden and latency between services) |
| Supabase PostgreSQL materialized views | Delegate aggregation to database (faster, consistent), no application-level caching overhead | Redis caching (adds operational complexity, eventual consistency risk) |
| TypeScript interfaces for layer contracts | Ensures type safety at compile-time, prevents runtime surprises in data flow | Looser typing (would increase debugging difficulty as system grows) |
| Vercel/CloudFlare Workers as primary deployments | Native support for Next.js, minimal configuration, auto-scaling, global edge distribution | Self-hosted (would require more ops work, less reliable scaling) |

**Commitment**: Implementation will follow this structure and deployment model. If complexity arises during development, evaluate whether simplification is possible (remove features, defer to Phase 2) rather than adding abstraction layers.

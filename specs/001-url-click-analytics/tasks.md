# Tasks: URL Shortener with Click Analytics

**Branch**: 001-add-url-click-analytics | **Date**: 2026-04-13
**Input**: Artifacts from `specs/001-url-click-analytics/`
**Prerequisites**: ✅ spec.md (user stories), ✅ plan.md (tech context), ✅ data-model.md (entities), ✅ contracts/ (APIs)

**Tests**: Test tasks are REQUIRED per constitution. Every user story MUST include unit, integration, and regression coverage before implementation.

**Organization**: Tasks grouped by user story to enable independent implementation, testing, and deployment.

## Format: `- [ ] [ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3) - setup and foundational phases have no label
- **File paths**: Concrete, absolute references from project root

## Path Convention (Next.js Full-Stack)

```
app/              # Next.js App Router pages + API routes
lib/              # Shared utilities, types, database clients
services/         # Business logic layer
components/       # React components
tests/            # Test suites (unit, integration, component)
sql/              # Database schema and migrations
public/           # Static assets
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Completion**: All shared infrastructure ready before user stories begin

- [ ] T001 Create project structure per implementation plan (app/, lib/, services/, components/, tests/, sql/, public/)
- [ ] T002 Initialize Next.js 14 project with TypeScript, Supabase SDK, React 18, TailwindCSS dependencies
- [ ] T003 [P] Setup eslint, prettier, and husky pre-commit hooks
- [ ] T004 [P] Configure environment variables (.env.example, .env.local template)
- [ ] T005 [P] Create lib/db.ts for Supabase client initialization with connection pooling
- [ ] T006 [P] Create lib/types.ts with TypeScript interfaces (ShortLink, ClickEvent, User)
- [ ] T007 [P] Create lib/errors.ts for custom error classes and HTTP error handling
- [ ] T008 [P] Create lib/constants.ts for configuration (SHORT_CODE_LENGTH, BASE_URL, valid sources/devices)
- [ ] T009 [P] Configure TailwindCSS and component library (Shadcn/ui or Headless UI)
- [ ] T010 Create next.config.js with standalone build configuration for production deployment
- [ ] T011 Configure vitest.config.ts and setup React Testing Library for component tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T012 Create database schema in sql/schema.sql with users, short_links, click_events tables plus constraints
- [ ] T013 [P] Create database views in sql/views.sql (daily_clicks_mv, weekly_clicks_mv materialized views)
- [ ] T014 Create lib/validation.ts with validateUrl(), generateShortCode(), parseDeviceSource() functions
- [ ] T015 [P] Create app/api/health/route.ts health check endpoint (for Docker/load balancers)
- [ ] T016 [P] Create lib/database.ts base database query functions (select, insert, update, upsert)
- [ ] T017 [P] Create services/errorHandler.ts middleware for consistent error responses
- [ ] T018 [P] Create components/ErrorBoundary.tsx for React error boundaries
- [ ] T019 [P] Create components/EmptyState.tsx reusable empty state component
- [ ] T020 [P] Create lib/response.ts for standardized success/error response formatting

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Tạo và sử dụng Short URL (Priority: P1) 🎯 MVP

**Goal**: Enable users to create short URLs and redirect to destination URLs. Foundation for analytics.

**Independent Test**: Create short URL via form/API → copy link → click link → verify redirect to original URL

### Tests for User Story 1 (REQUIRED) ⚠️

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T021 [P] [US1] Unit tests for validateUrl() and generateShortCode() in tests/unit/validation.test.ts
- [ ] T022 [P] [US1] Unit tests for analytics aggregation logic in tests/unit/analytics.test.ts
- [ ] T023 [P] [US1] Contract test for POST /api/shorten endpoint (request/response validation) in tests/contract/shorten.test.ts
- [ ] T024 [P] [US1] Contract test for GET /api/redirect/[code] endpoint in tests/contract/redirect.test.ts
- [ ] T025 [US1] Integration test for full redirect flow (create URL → redirect → verify destination) in tests/integration/redirect.test.ts
- [ ] T026 [P] [US1] Component tests for ShortenForm component in tests/component/ShortenForm.test.tsx
- [ ] T027 [P] [US1] Component tests for ClickToCopy component in tests/component/ClickToCopy.test.tsx

### Implementation for User Story 1

- [ ] T028 [P] [US1] Create services/shortUrl.ts with createShortUrl() and resolveShortUrl() functions
- [ ] T029 [P] [US1] Create app/api/shorten/route.ts POST endpoint for URL shortening
- [ ] T030 [P] [US1] Create app/api/redirect/[code]/route.ts GET endpoint for URL redirect
- [ ] T031 [US1] Implement click event recording in redirect handler (basic click_count increment)
- [ ] T032 [P] [US1] Create components/ShortenForm.tsx with form validation and submission
- [ ] T033 [P] [US1] Create components/ClickToCopy.tsx for copying short URL to clipboard
- [ ] T034 [P] [US1] Create app/page.tsx home page with ShortenForm and example short links
- [ ] T035 [US1] Add validation error handling and user-facing error messages
- [ ] T036 [US1] Add logging for short URL creation and redirect events (lib/logger.ts or console)
- [ ] T037 [US1] Implement database persistence: INSERT short_links, UPDATE click_count on redirect

**Checkpoint**: ✅ User Story 1 complete and independently testable. MVP delivers short URL creation + redirect.

---

## Phase 4: User Story 2 - Ghi nhan click analytics (Priority: P2)

**Goal**: Track click events with source and device classification. Enable per-link analytics queries.

**Independent Test**: Create short URL → generate clicks with different sources/devices → verify analytics endpoint returns correct aggregations

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T038 [P] [US2] Unit tests for click event classification in tests/unit/clickTracking.test.ts
- [ ] T039 [P] [US2] Unit tests for analytics aggregation in tests/unit/analytics.test.ts
- [ ] T040 [P] [US2] Contract test for GET /api/analytics/[code] endpoint in tests/contract/analytics.test.ts
- [ ] T041 [US2] Integration test for full click tracking flow in tests/integration/tracking.test.ts
- [ ] T042 [US2] Regression test for concurrent click handling (no duplicate counting) in tests/integration/concurrency.test.ts

### Implementation for User Story 2

- [ ] T043 [US2] Create services/clickTracking.ts with recordClick() and parseDeviceSource() functions
- [ ] T044 [P] [US2] Create app/api/analytics/[code]/route.ts GET endpoint for per-link stats
- [ ] T045 [US2] Implement click event insertion in clickTracking service (INSERT click_events)
- [ ] T046 [P] [US2] Create services/analytics.ts with getPerLinkStats() and performanceMetrics functions
- [ ] T047 [US2] Implement device/source classification from User-Agent and Referer headers
- [ ] T048 [P] [US2] Add click event logging with source, device, timestamp, IP hash (for debugging)
- [ ] T049 [US2] Implement data consistency validation (click count vs. event count tolerance <1%)
- [ ] T050 [US2] Add regression handling: handle missing/unknown device/source gracefully
- [ ] T051 [US2] Implement concurrent request handling (optimize click_count increments to avoid races)

**Checkpoint**: ✅ User Story 2 complete. Analytics data collection working, per-link stats retrievable.

---

## Phase 5: User Story 3 - Dashboard thông ke (Priority: P3)

**Goal**: Provide analytics dashboard with daily/weekly trends and top links ranking.

**Independent Test**: Load dashboard with date range → verify trend chart renders → verify top links table sorts by clicks

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T052 [P] [US3] Unit tests for dashboard data formatting in tests/unit/dashboard.test.ts
- [ ] T053 [P] [US3] Contract test for GET /api/dashboard endpoint in tests/contract/dashboard.test.ts
- [ ] T054 [US3] Integration test for dashboard query consistency (events → aggregates → API response) in tests/integration/dashboard.test.ts
- [ ] T055 [P] [US3] Component tests for DashboardChart (trend visualization) in tests/component/DashboardChart.test.tsx
- [ ] T056 [P] [US3] Component tests for TopLinksTable in tests/component/TopLinksTable.test.tsx
- [ ] T057 [P] [US3] Component tests for DateRangePicker in tests/component/DateRangePicker.test.tsx
- [ ] T058 [US3] Performance test: dashboard load time <3s for 30-day range with 1000+ links (load test)

### Implementation for User Story 3

- [ ] T059 [P] [US3] Create services/analytics.ts with getDashboardData(), aggregateByDay(), aggregateByWeek() functions
- [ ] T060 [US3] Create app/api/dashboard/route.ts GET endpoint for aggregated analytics
- [ ] T061 [P] [US3] Create components/DashboardChart.tsx with Chart.js/Recharts for trend visualization
- [ ] T062 [P] [US3] Create components/TopLinksTable.tsx with sortable table of top links by clicks
- [ ] T063 [P] [US3] Create components/DateRangePicker.tsx for date range selection (daily/weekly toggle)
- [ ] T064 [US3] Create app/dashboard/page.tsx dashboard layout with filter controls
- [ ] T065 [US3] Implement materialized view refresh logic (nightly batch or on-demand) in services/analytics.ts
- [ ] T066 [P] [US3] Add empty state handling when no data in date range
- [ ] T067 [P] [US3] Add error handling for invalid date ranges
- [ ] T068 [US3] Implement dashboard caching (5 minute TTL for same parameters)
- [ ] T069 [US3] Add analytics insights calculation (peak source, peak device, trend direction, percent change)

**Checkpoint**: ✅ User Story 3 complete. Full analytics dashboard functional, all user stories independent and deployable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality, consistency, and deployment readiness across all user stories

### Documentation & Quickstart Validation

- [ ] T070 [P] Update README.md with feature overview, local setup (Docker), and quick start
- [ ] T071 [P] Create CONTRIBUTING.md with development guidelines
- [ ] T072 [P] Run and verify quickstart.md (Docker + local setup work end-to-end)
- [ ] T073 [P] Generate API documentation (Swagger/OpenAPI or doc comments)

### Code Quality & Consistency

- [ ] T074 [P] Run linter across all files: npm run lint
- [ ] T075 [P] Run code formatter: npm run format
- [ ] T076 [P] Run TypeScript type checker: npm run tsc
- [ ] T077 [P] Code cleanup: remove unused imports, refactor repetition, simplify complex functions
- [ ] T078 [P] Add comprehensive error handling across all endpoints (400, 404, 500 cases)
- [ ] T079 [P] Add request/response logging middleware

### Testing & Coverage

- [ ] T080 [P] Run full test suite: npm run test
- [ ] T081 [P] Generate coverage report: npm run test:coverage
- [ ] T082 [P] Verify unit test coverage >80% for services/, lib/
- [ ] T083 [P] Verify integration test coverage for all API endpoints
- [ ] T084 [P] Add regression tests for reported bugs or edge cases

### UX & Consistency

- [ ] T085 [P] [US1] Validate UX states (loading, empty, success, error) for home page
- [ ] T086 [P] [US3] Validate UX states for dashboard (loading data, empty state, chart loaded, error)
- [ ] T087 [P] Verify consistent typography, spacing, colors across all pages (TailwindCSS)
- [ ] T088 [P] Test responsive design on mobile, tablet, desktop viewports
- [ ] T089 [P] Verify accessibility (WCAG AA compliance for forms, tables, charts)

### Performance Validation

- [ ] T090 [US1] Measure redirect latency: p95 <50ms cold, <10ms warm (local + Docker)
- [ ] T091 [US3] Measure dashboard load time: p95 <3s for 30-day range (from spec SC-004)
- [ ] T092 [P] Measure analytics accuracy: verify click counts within <1% of event count (from spec SC-003)
- [ ] T093 [P] Verify bundle size: main app bundle <200KB (TailwindCSS + React optimizations)
- [ ] T094 [P] Verify database query performance: no N+1 queries, use indexes effectively
- [ ] T095 [P] Document performance budgets met in PERFORMANCE.md

### Security & Hardening

- [ ] T096 [P] Validate URL input (prevent open redirect, XSS attacks)
- [ ] T097 [P] Add CORS headers configuration for cross-origin requests
- [ ] T098 [P] Implement rate limiting on /api/shorten (100 req/hour per IP) - optional
- [ ] T099 [P] Add security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] T100 [P] Verify no sensitive data in logs (passwords, keys, PII)

### Deployment Readiness

- [ ] T101 [P] Build production Docker image: docker build -t url-shortener:latest .
- [ ] T102 [P] Test Docker image locally: docker run -p 3000:3000 url-shortener:latest
- [ ] T103 [P] Build optimized Next.js bundle: npm run build
- [ ] T104 [P] Verify environment variables configured for production
- [ ] T105 [P] Create deployment checklist (DB backups, monitoring, error tracking)
- [ ] T106 [P] Basic load test: simulate 1000 concurrent requests, verify <50ms redirect latency

### Final Validation & Sign-Off

- [ ] T107 [P] Run all tests one final time: npm run test
- [ ] T108 [P] Verify all user stories are independent and testable (no broken dependencies)
- [ ] T109 [P] Verify no NEEDS CLARIFICATION markers remain in spec/plan/contracts
- [ ] T110 [P] Constitution compliance review: Code Quality ✅, Testing ✅, UX ✅, Performance ✅, Maintainability ✅
- [ ] T111 [P] Document any deviations from plan with rationale
- [ ] T112 Create CHANGELOG.md entry for v1.0.0 with feature summary

**Checkpoint**: ✅ All phases complete. Feature fully implemented, tested, documented, and production-ready.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKER - no user stories until complete)
    ├── Phase 3: User Story 1 (P1) ← Can start after Phase 2
    ├── Phase 4: User Story 2 (P2) ← Can start after Phase 2
    ├── Phase 5: User Story 3 (P3) ← Can start after Phase 2
Phase 6: Polish & Cross-Cutting (After desired user stories)
```

### Recommended Execution Strategy

**Option A: Sequential MVP Fast Track (2-3 weeks)**
1. Complete Phase 1: Setup (1 day)
2. Complete Phase 2: Foundational (1 day)
3. Complete Phase 3: User Story 1 (3-5 days) - SHIP MVP HERE
4. Complete Phase 4: User Story 2 (3-5 days) - Add analytics
5. Complete Phase 5: User Story 3 (3-5 days) - Add dashboard
6. Complete Phase 6: Polish (2 days)

**Option B: Parallel Teams (1-2 weeks)**
- Team A: Phase 1 + 2 (2 days)
- Team B: Phase 3 (US1) while Team A finishes Phase 2 (5 days parallel)
- Team B + Team C: Phase 4 (US2) + Phase 5 (US3) in parallel while Team A starts Phase 6 (3 days parallel)
- All teams: Final Phase 6 validation (1 day)

**Option C: MVP Only (5 days)**
- Complete Phase 1 + 2 (2 days)
- Complete Phase 3 (3 days)
- Deploy minimal MVP (URL creation + redirect only)
- Plan Phase 4 + 5 for Phase 2 release

### Within Each User Story

Recommended order:
1. **Tests first** (T021-T027 for US1, etc.) - Write failing tests
2. **Models** (if any) in parallel - T028 for US1
3. **Services** - T028-T031 for US1
4. **API endpoints** - T029-T030 for US1
5. **Components** - T032-T034 for US1
6. **Integration** - T035-T037 for US1
7. **Verify tests pass** before moving to next story

### Parallel Opportunities Within Phase

**Phase 1** (11 tasks, ~4 marked [P]):
- All [P] tasks (T003, T004, T005, T006, T007, T008, T009) can run in parallel
- T001, T002 are prerequisites
- T010, T011 can start when T001, T002 complete

**Phase 2** (9 tasks, ~6 marked [P]):
- T012 (schema) should complete first
- T013 (views) depends on T012
- All other [P] tasks can run in parallel
- T014-T020 mostly independent

**Phase 3 (US1)** (17 tasks, ~5 test tasks marked [P], 2 impl tasks marked [P]):
- All test [P] tasks (T021-T027) can run in parallel (write tests first)
- Implementation: T028 (models) can run in parallel with service setup
- T029-T030 (API routes) can run in parallel
- T032-T033 (components) can run in parallel
- T034 integrates everything

**Phase 4 (US2)** (6 impl tasks, ~3 marked [P]):
- Tests can run in parallel
- Services and endpoint can run in parallel

**Phase 5 (US3)** (11 impl tasks, ~5 marked [P]):
- Tests can run in parallel
- Components (DashboardChart, TopLinksTable, DateRangePicker) can run in parallel
- Dashboard endpoint and page integration runs last

**Phase 6** (43 tasks, many marked [P]):
- All [P] validation tasks can run in parallel
- Final sequential: T107-T112 (final tests, docs, sign-off)

---

## Success Criteria & Completion Definition

A task is ✅ **COMPLETE** when:

1. **Code exists**: Implementation file created per path specified
2. **Tests pass**: If task includes tests, all must pass
3. **No console errors**: Code runs without errors in dev/prod
4. **Documentation updated**: If new files created, update relevant docs
5. **Validation successful**: If checklist required, mark items complete

**Phase complete** when:
- All tasks marked ✅
- All tests for that phase passing
- No blocking issues preventing next phase start

**Feature complete (ready to ship)** when:
- At least Phase 1 + 2 + 3 complete ✅ (MVP: URL creation + redirect)
- OR Phase 1 + 2 + 3 + 4 + 5 complete ✅ (Full feature)
- Phase 6 polish tasks passing as needed

---

## Quick Navigation

| Phase | Focus | Est. Duration | Key Output |
|-------|-------|---------------|-----------|
| 1 | Project Setup | 1 day | Project structure, dependencies |
| 2 | Foundation | 1 day | Database schema, error handling |
| 3 | User Story 1 (P1) | 3-5 days | Short URL creation + redirect |
| 4 | User Story 2 (P2) | 3-5 days | Click analytics collection |
| 5 | User Story 3 (P3) | 3-5 days | Analytics dashboard |
| 6 | Polish | 2 days | Testing, docs, deployment |

**Total elapsed time**: 2-3 weeks with small team, 1-2 weeks with parallel teams.

---

## Task Tracking Best Practices

1. **Mark tasks in progress**: Use `[IN PROGRESS]` or similar while working
2. **Link to PRs**: Reference pull request numbers when submitting code
3. **Document blockers**: If stuck, document blocker and ask for help
4. **Parallel work coordination**: Use git branches to avoid conflicts
5. **Test-driven flow**: Always verify [P] tests fail before implementing
6. **Phase sign-offs**: Run full test suite before declaring phase complete
7. **Regular progress updates**: Share completion status in team standups

---

Generated by `/speckit.tasks` | Branch: 001-add-url-click-analytics | Seed Date: 2026-04-13

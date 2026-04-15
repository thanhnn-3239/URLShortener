# Implementation Plan: Chuẩn hóa deploy Production trên Vercel với Supabase

**Branch**: `002-execute-feature-hook` | **Date**: 2026-04-15 | **Spec**: [specs/002-fix-vercel-supabase-deploy/spec.md](specs/002-fix-vercel-supabase-deploy/spec.md)
**Input**: Feature specification from `/specs/002-fix-vercel-supabase-deploy/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

**Primary Goal**: Standardize production deployment on Vercel + Supabase by fixing missing environment variable configuration that broke database connectivity. Implementation includes:
1. Fail-fast environment validation at runtime initialization (not at first request)
2. Enforce strictness for both Production and Preview environments on Vercel
3. Provide clear, actionable error messages and comprehensive deployment documentation
4. Create post-deployment verification checklist to catch misconfigurations early

## Technical Context

**Language/Version**: TypeScript 5.2+, Node.js 18+ (via Next.js LTS)
**Primary Dependencies**: Next.js 14+, Supabase SDK (@supabase/supabase-js), React 18+, TailwindCSS
**Storage**: Supabase PostgreSQL (remote database on Vercel deployments)
**Testing**: Vitest/Jest, React Testing Library
**Target Platform**: Vercel (serverless Node.js runtime) + Supabase cloud
**Project Type**: Web application (Next.js 14 - full-stack)
**Performance Goals**:
  - Core paths (shorten, redirect, analytics): <200ms p95 latency
  - No additional overhead from env validation (validation runs once at startup)
**Constraints**:
  - Must support both Production and Preview deployments
  - Cannot increase cold-start latency perceptibly
  - Database connection pooling via Supabase
**Scale/Scope**:
  - 3 main user flows: create short URL, retrieve/redirect, view dashboard analytics
  - Health check endpoint for deployment verification

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **Code Quality Gate**:
- Impacted modules: `lib/database.ts`, `lib/apiMiddleware.ts`, new `lib/envValidation.ts`
- Error handling expectations: Clear, actionable error messages on invalid/missing env variables
- Naming: Error codes like `ENV_VALIDATION_FAILED`, `MISSING_DATABASE_URL` for consistency
- Complexity: Validation logic is simple (string presence checks + basic format validation)
- No new abstractions needed; fail-fast strategy is straightforward startup check

✅ **Testing Gate**:
- Unit tests: Validation logic tests for each required env var (present, missing, invalid format)
- Integration tests: Database connection with valid/invalid credentials during app startup
- Regression tests: Existing shorten, redirect, analytics flows must pass with proper env setup
- Test strategy: Fail-first tests for missing env scenario, then implement validation
- CI commands: `npm test -- lib/` for unit tests, `npm run test:integration` for deployment tests

✅ **UX Consistency Gate**:
- Affected flows: None at runtime; affected operational flow is deployment/initialization only
- Error states: 500 Service Unavailable + clear stderr logs when env missing or invalid
- Terminology: Consistent with "Configuration Error" pattern used in existing error responses
- Health endpoint returns 503 if validation fails
- Documentation uses consistent terminology across Vercel setup, CLI output, logs

✅ **Performance Gate**:
- Budget: Environment validation must complete in <50ms at startup (minimal overhead)
- Validation method: Single synchronous check of env vars at middleware/runtime init
- No per-request overhead after startup; validation happens once
- No additional database queries for validation

✅ **Maintainability Gate**:
- Implementation slices: (1) env validation module, (2) startup integration, (3) error handler, (4) docs
- Simplicity preferred: Direct env checks vs. complex schema validation library
- Clear responsibility separation: validation logic isolated from business logic

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-vercel-supabase-deploy/
├── plan.md              # This file (filled by /speckit.plan command)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── checklists/          # Deployment verification checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── health/          # Health check endpoint (validates env at startup)
│   ├── shorten/         # Short URL creation
│   ├── redirect/        # URL retrieval and redirect
│   ├── analytics/       # Click tracking and metrics
│   └── dashboard/       # Analytics dashboard

lib/
├── envValidation.ts     # [NEW] Environment variable validation logic
├── database.ts          # Supabase client initialization (uses validated env)
├── apiMiddleware.ts     # Error handling middleware (catches validation failures)
├── errors.ts            # Standard error types (includes env validation errors)
├── logger.ts            # Logging utility for validation errors
├── constants.ts         # Deployment environment constants
└── types.ts             # TypeScript types

middleware.ts           # Next.js middleware (runs early in request lifecycle)

tests/
├── unit/
│   ├── envValidation.test.ts     # [NEW] Validation logic tests
│   ├── database.test.ts          # Updated DB init tests with env scenarios
│   └── errors.test.ts            # Error type tests
├── integration/
│   ├── health.test.ts            # Health endpoint validation tests
│   ├── redirect.test.ts          # Redirect with invalid env scenarios
│   └── dashboard.test.ts         # Dashboard API with env validation
└── contract/
    └── [existing contract tests]
```

**Structure Decision**: Standard Next.js 14 layout with separation of concerns:
- `lib/envValidation.ts` handles all environment validation logic (DRY principle)
- `lib/database.ts` uses validated env to initialize Supabase client
- Startup-time validation prevents broken configurations from serving any requests
- Error module extended to include configuration error types
- Tests follow existing patterns: unit tests for logic, integration tests for runtime behavior

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

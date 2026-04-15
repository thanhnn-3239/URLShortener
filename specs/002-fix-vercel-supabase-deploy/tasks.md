# Task Breakdown: Chuẩn hóa deploy Production trên Vercel với Supabase

**Feature ID**: 002-fix-vercel-supabase-deploy
**Created**: 2026-04-15
**Phase Structure**: Setup → Foundational → User Stories (US1→US2→US3) → Polish
**Total Tasks**: 31
**Estimated Duration**: 3-4 weeks (including review and testing cycles)

---

## Task Summary by User Story

| Story | Title | Task Count | Priority |
|-------|-------|-----------|----------|
| US1 | Production environment configuration | 9 | P1 |
| US2 | Production deployment guide | 9 | P2 |
| US3 | Post-deployment verification checklist | 5 | P3 |
| — | Setup & Foundational | 5 | —— |
| — | Polish & Cross-cutting | 3 | —— |
| **Total** | | **31** | |

---

## Phase 1: Setup (Project Initialization)

_Prerequisite: All setup tasks must complete before any user story work begins._

- [ ] T001 Verify Next.js 14+ project structure and configuration in [next.config.js](../../next.config.js)
- [ ] T002 Verify TypeScript configuration allows strict type checking in [tsconfig.json](../../tsconfig.json)
- [ ] T003 Verify test framework setup (Vitest/Jest) for unit and integration tests in [vitest.config.ts](../../vitest.config.ts)

---

## Phase 2: Foundational (Blocking Prerequisites)

_All foundational tasks must complete before user story implementation. These are shared by all stories._

- [ ] T004 [P] Create type definitions for environment validation in [lib/types.ts](../../lib/types.ts):
  - EnvironmentProfile interface
  - EnvVariable interface
  - ConfigurationError interface
  - HealthCheckResult interface
  - DeploymentVerificationChecklist interface

- [ ] T005 [P] Create constants for required environment variables in [lib/constants.ts](../../lib/constants.ts):
  - REQUIRED_ENV_VARIABLES list (DATABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
  - ENVIRONMENT_PRODUCTION constant
  - ENVIRONMENT_PREVIEW constant
  - Error code constants (MISSING_DATABASE_URL, DATABASE_CONNECTION_FAILED, etc.)

- [ ] T006 Create base environment validation module in [lib/envValidation.ts](../../lib/envValidation.ts):
  - Implement `validateEnvironment()` function that checks presence of required env vars
  - Implement `validateEnvFormat()` function for format validation (DATABASE_URL pattern, key format)
  - Implement `getEnvironmentProfile()` function that returns current profile validation state
  - Export error builder function for consistent error message generation
  - No database calls; validation runs at startup only

- [ ] T007 [P] Update error types in [lib/errors.ts](../../lib/errors.ts):
  - Add ConfigurationError class extending Error
  - Add standard error codes enum (MISSING_DATABASE_URL, DATABASE_CONNECTION_FAILED, ENVIRONMENT_VALIDATION_FAILED)
  - Ensure error messages follow format: "What is wrong" + "What should be done" + "Where to fix"

- [ ] T008 [P] Create health check endpoint contract test in [tests/contract/health.test.ts](../../tests/contract/health.test.ts):
  - Test GET /api/health returns 200 with valid JSON when all env vars present
  - Test endpoint returns 503 when DATABASE_URL is missing
  - Test endpoint includes error details with code, message, hint, and location
  - Test response includes timestamp and responseTime fields
  - Test response structure matches schema from contracts/health-endpoint.md

---

## Phase 3: User Story 1 (P1 - Production Environment Configuration)

**Goal**: Ensure production environment is properly configured with fail-fast validation at runtime initialization
**Independent Test**: Deploy to Vercel with required env vars set; verify all business endpoints work without configuration errors

### US1 Implementation Tasks

- [ ] T009 [P] [US1] Implement required environment variable validation in [lib/envValidation.ts](../../lib/envValidation.ts):
  - Check DATABASE_URL presence and postgresql:// format
  - Check SUPABASE_ANON_KEY presence and length (JWT format validation)
  - Check SUPABASE_SERVICE_ROLE_KEY presence and length
  - Return detailed ConfigurationError for each failure with actionable hint
  - Throw early if critical env vars missing (fail-fast strategy)

- [ ] T010 [P] [US1] Integrate env validation into database module initialization in [lib/database.ts](../../lib/database.ts):
  - Call validateEnvironment() at module import time (not lazily)
  - Log validation errors to stderr with full details before throwing
  - Ensure database client creation fails fast if env is invalid
  - Update comments to clarify validation happens at startup, not per-request

- [ ] T011 [US1] Create env validation error handler in [lib/apiMiddleware.ts](../../lib/apiMiddleware.ts):
  - Catch ConfigurationError in API error handling middleware
  - Return 503 Service Unavailable with structured error response
  - Include deployment health status in response body
  - Ensure error response format matches contracts/error-responses.md

- [ ] T012 [P] [US1] Implement health check endpoint in [app/api/health/route.ts](../../app/api/health/route.ts):
  - Validate all required environment variables
  - Test database connection with actual query (e.g., "SELECT 1" through pooler)
  - Return 200 OK with healthy response if all checks pass
  - Return 503 Service Unavailable with detailed error array if any check fails
  - Include responseTime metric in response
  - Match response schema from contracts/health-endpoint.md exactly

- [ ] T013 [P] [US1] Write unit tests for environment validation logic in [tests/unit/envValidation.test.ts](../../tests/unit/envValidation.test.ts):
  - Test validateEnvironment() returns valid profile when all env vars present
  - Test validateEnvironment() throws ConfigurationError when DATABASE_URL missing
  - Test validateEnvironment() throws when SUPABASE_ANON_KEY missing
  - Test validateEnvironment() validates PASSWORD_URL format (postgresql:// prefix)
  - Test error messages include hint and location (where to fix in Vercel)
  - Test error codes are consistent (MISSING_DATABASE_URL, INVALID_DATABASE_URL_FORMAT)

- [ ] T014 [P] [US1] Write integration tests for database initialization with env scenarios in [tests/integration/database.test.ts](../../tests/integration/database.test.ts):
  - Test app initialization succeeds with valid env vars set
  - Test app fails to initialize when DATABASE_URL missing (startup error)
  - Test error logs include clear guidance for operator
  - Test Supabase client creation fails if any critical env missing

- [ ] T015 [P] [US1] Write integration tests for health endpoint in [tests/integration/health.test.ts](../../tests/integration/health.test.ts):
  - Test GET /api/health returns 200 when environment fully configured
  - Test includes database.connected and environment.validated in response
  - Test returns 503 when DATABASE_URL missing or invalid
  - Test error response includes ConfigurationError objects with code, message, hint, location
  - Test endpoint response time is included in response

- [ ] T016 [US1] Update middleware to enforce env validation early in request cycle in [middleware.ts](../../middleware.ts):
  - Add comment explaining env validation happens at startup, not per-request
  - No additional changes needed; validation runs before middleware

### US1 Acceptance Tests

All tests in T013-T015 must pass before US1 is considered complete.
Manual test: Deploy to Vercel with complete env vars and verify:
- All 3 business endpoints (shorten, redirect, dashboard) function without configuration errors
- Health endpoint returns 200 with healthy status

---

## Phase 4: User Story 2 (P2 - Production Deployment Guide)

**Goal**: Provide complete, operator-friendly deployment documentation
**Independent Test**: A team member unfamiliar with the project can follow the guide and successfully deploy to Vercel in under 20 minutes

### US2 Implementation Tasks

- [ ] T017 [P] [US2] Create comprehensive deployment guide in [DEPLOYMENT.md](../../DEPLOYMENT.md):
  - Step 1: Pre-deployment checklist (what to gather before starting)
  - Step 2: Repository preparation (ensure code is ready)
  - Step 3: Create or link Vercel project (with CLI and browser UI options)
  - Step 4: Configure environment variables in Vercel (detailed UI screenshots instructions)
  - Step 5: Deploy to Vercel (CLI and GitHub auto-deploy options)
  - Step 6: Verify deployment health (test health endpoint)
  - Step 7: Test business endpoints (create short URL, redirect, view dashboard)
  - Include exact Supabase UI navigation paths (Project Settings → Database → Connection info)
  - Include copy-paste template for .env.local (with emphasis: NEVER commit)
  - Compliance note: Document that Preview environment must also have correct env vars

- [ ] T018 [P] [US2] Create troubleshooting section in [DEPLOYMENT.md](../../DEPLOYMENT.md):
  - Issue: "Build succeeded but health endpoint returns 503"
    - Check: All 3 env vars set in Vercel Project Settings
    - Check: Env vars marked for Production and Preview environments
    - Check: Redeploy after setting variables (new deployment needed)
  - Issue: "DATABASE_URL value is empty despite being set in Vercel"
    - Check: Verify exact format in Vercel matches Supabase (postgresql://...)
    - Check: No quotes around value in Vercel UI
  - Issue: "Connection refused to database"
    - Check: Verify Supabase project is active and not paused
    - Check: Test connection from local machine first (.env.local)
  - Issue: "Deployment stuck in unhealthy state"
    - Solution: Check Vercel deployment logs → see specific env error
    - Solution: Use `vercel env` CLI to verify variables are accessible
  - Issue: "Preview deployment works but Production does not"
    - Check: Different credentials used for Preview vs. Production Supabase?
    - Solution: Set SAME env vars for both Production and Preview in Vercel

- [ ] T019 [US2] Create Vercel environment variable setup reference in [docs/VERCEL_ENV_SETUP.md](../../docs/VERCEL_ENV_SETUP.md):
  - Table of all required env variables with descriptions
  - Column headers: Variable Name | Purpose | Example Format | Where to Find in Supabase | Environments (Prod/Preview)
  - DATABASE_URL row with full explanation and Supabase UI path
  - SUPABASE_ANON_KEY row with explanation and Supabase UI path
  - SUPABASE_SERVICE_ROLE_KEY row with explanation and Supabase UI path
  - Include warning: "DO NOT expose service role key in client-side code"
  - Include best practice: "Use separate Supabase project for Preview if possible"

- [ ] T020 [P] [US2] Create deployment environment configuration reference in [docs/ENVIRONMENT_PROFILES.md](../../docs/ENVIRONMENT_PROFILES.md):
  - Document Production profile (isProduction: true, strictness: high)
  - Document Preview profile (isProduction: true, strictness: high per spec)
  - Document Local profile (isProduction: false, strictness: low, .env.local only)
  - Clarify: Preview deployments on Vercel ARE production-like and must have correct env
  - Clarify: Only local development allows skipping or partial env configuration

- [ ] T021 [P] [US2] Update main README with deployment section in [README.md](../../README.md):
  - Link to comprehensive [DEPLOYMENT.md] guide
  - Add quick reference: "3 required environment variables"
  - Add quick reference: "Verify health endpoint after deploy"
  - Add link to troubleshooting section

- [ ] T022 [US2] Create Confluence/docs entry for ops team (if using internal wiki):
  - Copy troubleshooting section
  - Add runbook format for "Deploy URL Shortener to Vercel"
  - Include escalation path if health check fails

- [ ] T023 [US2] Update CONTRIBUTING.md to reference deployment guide in [CONTRIBUTING.md](../../CONTRIBUTING.md):
  - Add "Deploying to Production" section
  - Link to [DEPLOYMENT.md]
  - Link to [VERCEL_ENV_SETUP.md]
  - Clarify: "Never commit .env.local or credentials to repository"

- [ ] T024 [US2] Create example .env.template file in repository root as [.env.example](./.env.example):
  - Show placeholder format for DATABASE_URL
  - Show placeholder format for SUPABASE_ANON_KEY
  - Show placeholder format for SUPABASE_SERVICE_ROLE_KEY
  - Include instructions: "Copy to .env.local, fill with your Supabase values, NEVER commit"

- [ ] T025 [US2] Update API documentation in [docs/API.md](../../docs/API.md):
  - Add section: "Health Check Endpoint"
  - Document GET /api/health response codes and format
  - Document error response structure for health endpoint
  - Include examples of healthy and unhealthy responses

### US2 Acceptance Tests

Documentation review by non-author team member:
- [ ] Guide is complete and unambiguous for first-time deployer
- [ ] All Supabase UI paths are accurate and current
- [ ] Troubleshooting section covers the most common issues
- [ ] No undefined terms or unexplained concepts
- [ ] All code examples are correct and copy-paste-ready

---

## Phase 5: User Story 3 (P3 - Post-deployment Verification Checklist)

**Goal**: Operators can verify deployment health in <5 minutes using a structured checklist
**Independent Test**: Run checklist on deployed environment and confirm all items pass

### US3 Implementation Tasks

- [ ] T026 [P] [US3] Create post-deployment verification checklist in [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md):
  - Checklist Item 1: Environment Variables Set
    - Steps: Verify all 3 vars in Vercel Project Settings → Environment Variables
    - Expected: All vars present, marked for Production and Preview
    - Pass/Fail indicator
  - Checklist Item 2: Health Check Endpoint
    - Steps: `curl https://[your-vercel-url]/api/health`
    - Expected: HTTP 200 response with status: "healthy"
    - If fails: Link to troubleshooting section
  - Checklist Item 3: Database Connection
    - Steps: `curl https://[your-vercel-url]/api/health` and check database: "connected"
    - Expected: database field shows "connected"
    - If fails: Verify DATABASE_URL and credentials
  - Checklist Item 4: Create Short URL
    - Steps: POST to /api/shorten with test data
    - Expected: HTTP 200, returns short code
    - If fails: Check full error response
  - Checklist Item 5: Redirect Works
    - Steps: Retrieve short code from Item 4, visit /[code]
    - Expected: 301 redirect to original URL
    - If fails: Check database connectivity in health endpoint
  - Checklist Item 6: Dashboard Access
    - Steps: Navigate to /dashboard in browser
    - Expected: Page loads, displays analytics charts (or empty state)
    - If fails: Check browser console for errors
  - Checklist Item 7: Monitor Health Endpoint (Ongoing)
    - Steps: Set up monitoring or manual daily check
    - Expected: Health endpoint remains 200
    - If fails: Investigate any database connectivity issues

- [ ] T027 [P] [US3] Create shell script for automated checklist in [scripts/verify-deployment.sh](../../scripts/verify-deployment.sh):
  - Accept deployment URL as argument
  - Test 1: GET /api/health and verify HTTP 200
  - Test 2: Parse health response and check status: "healthy"
  - Test 3: Parse health response and check database: "connected"
  - Test 4: POST /api/shorten with sample data and verify response code
  - Test 5: Use returned short code to test redirect
  - Test 6: Report overall pass/fail with colored output
  - Include usage: `./scripts/verify-deployment.sh https://your-vercel-url`

- [ ] T028 [P] [US3] Write integration tests for business endpoints with env validation in [tests/integration/post-deploy-verification.test.ts](../../tests/integration/post-deploy-verification.test.ts):
  - Test: POST /api/shorten works when env properly configured
  - Test: Shorten endpoint returns 503 if DATABASE_URL missing
  - Test: Redirect endpoint works when env properly configured
  - Test: Redirect endpoint returns 503 if env invalid
  - Test: Dashboard API works when env properly configured
  - Test: Dashboard API returns 503 if env invalid
  - All tests verify error response format matches contracts/error-responses.md

- [ ] T029 [US3] Create monitoring dashboard configuration in [docs/MONITORING.md](../../docs/MONITORING.md):
  - Recommend 1-minute frequency health check monitoring (e.g., Vercel's built-in or UptimeRobot)
  - Document expected response for healthy deployment
  - Document alert thresholds (e.g., 3 consecutive 503 responses)
  - Document escalation procedure
  - Include Slack/PagerDuty integration examples

- [ ] T030 [US3] Create post-deployment sign-off template in [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md) (append to file):
  - Sign-off section at end of checklist
  - Fields: Deployment Date, Verifier Name, All Checks Passed Y/N, Issues Found (free text)
  - Used by operators to formally confirm deployment health

### US3 Acceptance Tests

- [ ] Run all items in DEPLOYMENT_CHECKLIST.md manually; all should pass
- [ ] Run scripts/verify-deployment.sh against production deployment; output shows all tests pass
- [ ] All integration tests in T028 pass with environment properly configured
- [ ] All integration tests in T028 correctly return 503 when env is misconfigured

---

## Phase 6: Polish & Cross-Cutting Concerns

_Final cleanup, testing, and documentation._

- [ ] T031 [P] Update CONSTITUTION_REVIEW.md with implementation completion summary in [CONSTITUTION_REVIEW.md](../../CONSTITUTION_REVIEW.md):
  - Confirm Code Quality Gate: Env validation module isolated, error messages actionable
  - Confirm Testing Gate: Unit tests, integration tests, and contract tests complete
  - Confirm UX Consistency Gate: Error format consistent across all responses
  - Confirm Performance Gate: Validation happens once at startup, <50ms overhead
  - Confirm Maintainability Gate: Clear separation of validation, database, and business logic
  - Note: All acceptance criteria from spec.md are met by implementation

---

## Dependency Graph & Phasing Strategy

```
Phase 1: Setup
  ↓
Phase 2: Foundational (T004-T008)
  ├─ T004: Type definitions
  ├─ T005: Constants
  ├─ T006: Env validation module
  ├─ T007: Error types
  └─ T008: Health endpoint contract test
  ↓
Phase 3: User Story 1 (T009-T016) - Can start once Phase 2 complete
  ├─ T009, T010: Core validation + DB integration
  ├─ T011: Error handling middleware
  ├─ T012: Health endpoint implementation
  └─ T013-T015: Unit & integration tests
  ↓
Phase 4: User Story 2 (T017-T025) - Can start once US1 complete
  ├─ T017-T018: Main deployment guide + troubleshooting
  ├─ T019-T021: Setup references & README
  └─ T022-T025: Additional docs and templates
  ↓
Phase 5: User Story 3 (T026-T030) - Can start once US2 complete
  ├─ T026: Checklist document
  ├─ T027: Automated verification script
  ├─ T028: Integration tests for post-deploy
  └─ T029-T030: Monitoring & sign-off
  ↓
Phase 6: Polish (T031)
```

---

## Parallel Execution Opportunities

### Within Foundational Phase (Phase 2)
Tasks T004, T005, T007, T008 can run in parallel:
- T004 (types) and T005 (constants) have no dependency on each other
- T007 (error types) depends on T005 (constants) for error codes
- T008 (contract test) can run parallel to T006 (validation module) — test written first, module implemented after

### Within User Story 1 Phase (Phase 3)
After T009 (validation logic) completes:
- T010, T011, T013 can run in parallel (different modules, no inter-dependencies)
- T012 (health endpoint) can run parallel to T010-T011 if T009 is complete
- T014, T015 (integration tests) can run in parallel to T012

### Within User Story 2 Phase (Phase 4)
All documentation tasks (T017-T025) can run in parallel:
- No code dependencies; each document is independent
- Assign to different team members to expedite completion

### Within User Story 3 Phase (Phase 5)
Tasks T026, T027 can run in parallel:
- Script (T027) doesn't depend on document (T026), though they should be consistent
- T028 (tests) can run parallel to T026-T027 if core validation from US1 is done

---

## Implementation Strategy: MVP Scope

**Recommended MVP for First Release** (Minimum Viable Product):
1. Phase 1: Complete all setup
2. Phase 2: Complete foundational (T004-T008)
3. Phase 3: Complete US1 core (T009, T010, T012, T013, T015)
   - Minimal: Env validation + health endpoint + tests
   - Can skip detailed middleware (T011) and database integration tests (T014) for MVP
4. Phase 4: Complete US2 core (T017-T018, T023)
   - Minimal: Main deployment guide + troubleshooting + README link
   - Can skip detailed reference docs (T019-T022) for MVP
5. Phase 5: Complete US3 core (T026)
   - Minimal: Checklist document only

**MVP Timeline**: 2 weeks
**Full Feature Timeline**: 3-4 weeks (including review cycles)

---

## Test Categories

### Unit Tests (T013)
- Environment variable presence checks
- Format validation (postgresql://, JWT format)
- Error code generation
- Error message composition

### Integration Tests (T014-T015, T028)
- Database module initialization with valid/invalid env
- Health endpoint request/response cycle
- Business endpoints with misconfiguration scenarios
- Response format validation against contracts

### Contract Tests (T008, T025)
- Health endpoint response schema compliance
- Error response format compliance
- Standard error code presence and correctness

### Acceptance Tests (US1, US2, US3)
- Manual deployment and verification
- Documentation clarity and completeness
- Operator ergonomics (checklist usability)

---

## Definition of Done

A task is complete when:

1. **Code changes implemented** (if applicable): All source files modified per task description
2. **Tests written and passing**: Unit, integration, or contract tests all pass
3. **Documentation updated**: README, DEPLOYMENT.md, or inline comments reflect changes
4. **No regressions**: Existing tests continue to pass
5. **Code review ready**: Changes follow project style and conventions
6. **Manually verified**: Manual test performed for each feature

Each user story is complete when all acceptance tests pass AND operator can independently deploy and verify using the documentation.

---

## File Checklist

Files to create (new):
- [ ] [lib/envValidation.ts](../../lib/envValidation.ts)
- [ ] [app/api/health/route.ts](../../app/api/health/route.ts)
- [ ] [tests/unit/envValidation.test.ts](../../tests/unit/envValidation.test.ts)
- [ ] [tests/integration/health.test.ts](../../tests/integration/health.test.ts)
- [ ] [tests/integration/post-deploy-verification.test.ts](../../tests/integration/post-deploy-verification.test.ts)
- [ ] [DEPLOYMENT.md](../../DEPLOYMENT.md)
- [ ] [docs/VERCEL_ENV_SETUP.md](../../docs/VERCEL_ENV_SETUP.md)
- [ ] [docs/ENVIRONMENT_PROFILES.md](../../docs/ENVIRONMENT_PROFILES.md)
- [ ] [docs/MONITORING.md](../../docs/MONITORING.md)
- [ ] [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md)
- [ ] [.env.example](./.env.example)
- [ ] [scripts/verify-deployment.sh](../../scripts/verify-deployment.sh)

Files to modify (existing):
- [ ] [lib/types.ts](../../lib/types.ts) — add interfaces
- [ ] [lib/constants.ts](../../lib/constants.ts) — add env constants
- [ ] [lib/errors.ts](../../lib/errors.ts) — add ConfigurationError class
- [ ] [lib/database.ts](../../lib/database.ts) — integrate env validation
- [ ] [lib/apiMiddleware.ts](../../lib/apiMiddleware.ts) — add config error handler
- [ ] [middleware.ts](../../middleware.ts) — add clarifying comments
- [ ] [README.md](../../README.md) — add deployment section
- [ ] [CONTRIBUTING.md](../../CONTRIBUTING.md) — add deployment reference
- [ ] [docs/API.md](../../docs/API.md) — document health endpoint
- [ ] [CONSTITUTION_REVIEW.md](../../CONSTITUTION_REVIEW.md) — completion summary
- [ ] [tests/integration/database.test.ts](../../tests/integration/database.test.ts) — add env scenarios

---

## Success Criteria Mapping

| Spec SC | Tasks Implementing | Verification |
|---------|------------------|--------------|
| SC-001 (100% deployments have correct env) | T009-T012, T017 | Manual verification checklist |
| SC-002 (<20 min first deployment) | T017-T019, T026 | Op team feedback |
| SC-003 (95% errors caught in checklist) | T026-T030 | Checklist execution |
| SC-004 (70% fewer rollbacks in 30 days) | T009-T012, T027 | Monitoring data post-deployment |
| SC-005 (100% missing env caught before request) | T009-T010, T015 | T015 integration tests |
| SC-006 (99% success rate for core flows) | T014, T028 | Integration test suites pass |

---

## Next Steps

1. **Review this task breakdown** with team leads and stakeholders
2. **Assign tasks** to team members (suggest 2-3 developers for this feature)
3. **Run before-tasks hook** (auto-commit via extensions.yml if needed)
4. **Execute Phase 1 & 2 in parallel** (setup is quick, foundational can start immediately)
5. **Execute Phases 3-5 sequentially** (each depends on previous)
6. **Merge to main** after all acceptance tests pass in Phase 5

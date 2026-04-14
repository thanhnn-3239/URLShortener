# Contributing

## Development Workflow

1. Create a feature branch.
2. Implement changes with tests.
3. Run verification gate before opening PR:

```bash
npm run verify:impl
```

4. Ensure tasks/checklists are updated when working from specs.

## Code Standards

- Language: TypeScript
- Keep changes focused and minimal.
- Reuse existing services and utilities where possible.
- Add tests for behavior changes.

## Testing Expectations

- Unit tests for business logic in `services/` and `lib/`
- Contract tests for API routes
- Integration tests for end-to-end API flows
- Component tests for UI behavior

Run tests:

```bash
npm run test
npm run test:coverage
```

## Lint and Type Safety

```bash
npm run lint
npm run tsc
```

## API Changes

When adding/changing endpoints:

1. Update route handlers in `app/api/`
2. Update contracts in `specs/001-url-click-analytics/contracts/`
3. Update `docs/API.md` and `docs/openapi.yaml`
4. Add/adjust contract and integration tests

## Commit Guidance

- Keep commits atomic.
- Use clear, imperative commit messages.
- Do not commit secrets or `.env.local`.

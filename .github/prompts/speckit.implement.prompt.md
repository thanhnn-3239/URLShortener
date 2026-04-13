---
agent: speckit.implement
---

## Post-Implementation Verification Gate

Before declaring implementation complete, always run:

1. `npm run verify:impl`

This gate includes:

1. `npm run lint`
2. `npm run tsc`
3. `npm run test`
4. `docker compose up -d --build`
5. URL smoke checks:
	1. `http://localhost:3000/` must return `200`
	2. `http://localhost:3000/api/health` must return `200`

If any step fails, do not report completion.

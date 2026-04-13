# Quickstart: URL Shortener with Click Analytics

**Date**: 2026-04-13 | **Branch**: 001-add-url-click-analytics

This guide walks developers through local setup, running tests, and deploying the URL Shortener feature.

---

## Prerequisites

- Node.js 18+
- npm 9+ or pnpm 8+ (or yarn 4+)
- Git
- Supabase account (free tier available at supabase.com)
- (Optional) Vercel account for deployment

---

## Local Setup

Choose one of the following setup methods:

### Option A: Docker Compose (Recommended)

Docker Compose provides an isolated, reproducible development environment with database included.

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/URLShortener.git
cd URLShortener
git checkout 001-add-url-click-analytics
```

#### 2. Start Services

```bash
# Start all services (PostgreSQL + Next.js app)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

Services will be available at:
- **App**: http://localhost:3000
- **PostgreSQL**: localhost:5432 (inside Docker network)
- **PgAdmin** (optional): http://localhost:5050

**Skip to "Development Server" section below** (no need for manual npm install).

---

### Option B: Local Setup (Traditional)

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/URLShortener.git
cd URLShortener
git checkout 001-add-url-click-analytics
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Create Supabase Project OR Use Docker Database

**Option B1: Remote Supabase (Production-like)**

1. Sign up/login at [supabase.com](https://supabase.com)
2. Click "New project"
3. Fill in project details:
   - **Project name**: `url-shortener-dev`
   - **Database password**: Generate strong password (save this!)
   - **Region**: Closest to you for lowest latency
4. Wait for project creation (~2 minutes)

**Option B2: Local Docker PostgreSQL**

Skip Supabase signup and use docker-compose PostgreSQL instead:

```bash
# Start PostgreSQL only
docker-compose up -d postgres

# Database will be ready at: localhost:5432
```

### 4. Initialize Database Schema

If using **Supabase**: In Supabase dashboard, go to **SQL Editor** and run contents of `sql/schema.sql`.

If using **Docker PostgreSQL**: Schema auto-initializes on first `docker-compose up` via mounted volumes.

### 5. Configure Environment Variables

Copy template and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

**For Remote Supabase**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://...  # from Supabase

NEXT_PUBLIC_SHORT_URL_BASE=http://localhost:3000
SHORT_CODE_LENGTH=6
NODE_ENV=development
```

**For Docker PostgreSQL**:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/url_shortener
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
NEXT_PUBLIC_SUPABASE_ANON_KEY=docker-dev-key
SUPABASE_SERVICE_ROLE_KEY=docker-dev-key

NEXT_PUBLIC_SHORT_URL_BASE=http://localhost:3000
SHORT_CODE_LENGTH=6
NODE_ENV=development
```

### 6. Initialize Git Hooks (Optional)

```bash
npm run husky:install
```

---

## Development Server

### Start Server (Local Setup)

```bash
npm run dev
```

Output:
```
> next dev
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local
  ✓ Ready in 1.23s
```

Visit http://localhost:3000 in browser.

### Docker Workflow

If using Docker Compose, services start automatically with:

```bash
docker-compose up -d
```

View application logs:
```bash
docker-compose logs -f app
```

View database logs:
```bash
docker-compose logs -f postgres
```

Stop services:
```bash
docker-compose down
```

Stop and remove data:
```bash
docker-compose down -v
```

Rebuild containers (after dependency changes):
```bash
docker-compose up -d --build
```

Access container shell:
```bash
# App shell
docker-compose exec app sh

# Database shell (psql)
docker-compose exec postgres psql -U postgres -d url_shortener
```

### Docker Services Reference

| Service | Port | Command |
|---------|------|---------|
| Next.js App | 3000 | `npm run dev` |
| PostgreSQL | 5432 | `postgres` |
| PgAdmin | 5050 | (optional, profile: dev) |
| Redis | 6379 | (optional, profile: dev) |

**Start with optional services (PgAdmin, Redis)**:
```bash
docker-compose --profile dev up
```

---

### Pages Available

- **Home** (`/`): Create short URL form
- **Dashboard** (`/dashboard`): Analytics dashboard
- **API Docs**: `/api/docs` (if Swagger/OpenAPI enabled)

---

## Running Tests

### Unit & Integration Tests

```bash
npm run test
```

Run specific test file:

```bash
npm run test:watch -- services/shortUrl.test.ts
```

Watch mode (auto-rerun on file changes):

```bash
npm run test:watch
```

### Component Tests

```bash
npm run test:ui
# Opens Vitest UI dashboard at http://localhost:51204
```

### E2E Tests (Browser Automation)

```bash
npm run test:e2e
```

### Coverage Report

```bash
npm run test:coverage
```

View HTML report:
```bash
open coverage/index.html
```

---

## API Testing

### Using cURL

```bash
# Create short URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"destination_url": "https://example.com/long-url"}'

# Response:
# {
#   "id": "550e8400...",
#   "code": "abc123",
#   "short_url": "http://localhost:3000/abc123",
#   ...
# }

# Redirect (follows automatically)
curl -L http://localhost:3000/api/redirect/abc123

# Get analytics
curl http://localhost:3000/api/analytics/abc123?start_date=2026-04-01&end_date=2026-04-13
```

### Using Postman or Insomnia

Import OpenAPI spec (if published):
- File → Import → Paste OpenAPI URL or JSON

Or manually add endpoints:
- **POST** `http://localhost:3000/api/shorten`
- **GET** `http://localhost:3000/api/redirect/:code`
- **GET** `http://localhost:3000/api/analytics/:code`
- **GET** `http://localhost:3000/api/dashboard`

---

## Database Inspection

### Docker PostgreSQL

Access database directly from container:

```bash
# Using psql inside container
docker-compose exec postgres psql -U postgres -d url_shortener

# Then run SQL queries...
postgres=# SELECT * FROM short_links LIMIT 10;
```

Or using PgAdmin web UI (optional, requires `--profile dev`):

```bash
docker-compose --profile dev up

# Visit http://localhost:5050
# Login: admin@example.com / admin
# Add PostgreSQL server:
#   - Hostname: postgres (Docker network name)
#   - Port: 5432
#   - Username: postgres
#   - Password: postgres
#   - Database: url_shortener
```

### Remote Supabase

View/edit database directly in Supabase:

1. Supabase Dashboard → SQL Editor
2. Run queries or browse tables:
   ```sql
   SELECT * FROM short_links LIMIT 10;
   SELECT * FROM click_events LIMIT 100;
   SELECT * FROM daily_clicks_mv;
   ```

Or use command-line client:

```bash
psql postgresql://postgres:PASSWORD@xxxxx.supabase.co:5432/postgres
# Then SQL queries...
```

---

## Troubleshooting

### Docker-Specific Issues

**"Cannot connect to Docker daemon"**

**Problem**: Docker Desktop not running or not installed

**Solution**:
1. Install Docker Desktop from [docker.com](https://docker.com/products/docker-desktop)
2. Start Docker Desktop application
3. Verify: `docker --version`

**"postgres service is not healthy after waiting"**

**Problem**: PostgreSQL container failed to start

**Solution**:
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart services
docker-compose down -v
docker-compose up -d
```

**"Connection refused" from app to postgres**

**Problem**: Service network issue

**Solution**:
```bash
# Verify network
docker network ls | grep url-shortener

# Verify postgres is running
docker-compose ps

# Check postgres connection from app container
docker-compose exec app psql -h postgres -U postgres -d url_shortener -c "SELECT 1"
```

**"Port 3000 already in use"**

**Problem**: Another service using port 3000

**Solution**: Change port in docker-compose.yml or environment:
```bash
APP_PORT=3001 docker-compose up -d
# Then visit http://localhost:3001
```

---

### Local Setup Issues

**"Connection refused" when starting dev server

**Problem**: Database not connecting (local setup)

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is set
3. Ensure Supabase project is active (not paused)
4. Test connection: `npm run db:test`

Or switch to Docker setup:
```bash
docker-compose up -d postgres
# Update .env.local with Docker DATABASE_URL
npm run dev
```

### "Unique key violation" on short code generation

**Problem**: Too many collisions (very rare)

**Solution**:
- Increase `SHORT_CODE_LENGTH` in `.env.local` (e.g., 7 or 8)
- Or clear test data: `DELETE FROM short_links WHERE created_at < NOW() - INTERVAL '1 hour'`

### Dashboard shows "No data available"

**Problem**: No clicks recorded yet

**Solution**:
1. Create a short URL via home page
2. Click the short link (or GET /api/redirect/[code])
3. Refresh analytics page
4. Check browser console for errors

### Tests fail with "SUPABASE_SERVICE_ROLE_KEY" not found

**Problem**: Environment variables not loaded for tests

**Solution**:
1. Ensure `.env.local` file exists in project root
2. Run `npm run test` (not via other test runners)
3. Check `.env.local` is NOT in `.gitignore` (add to git)

---

## Project Structure Quick Reference

```
URLShortener/
├── app/                  # Next.js App Router
│   ├── page.tsx         # Home page (create URL form)
│   ├── dashboard/       # Analytics dashboard page
│   └── api/             # API routes
├── lib/                 # Shared utilities
├── services/            # Business logic (create, track, analytics)
├── components/          # React components
├── tests/               # Test suites
├── sql/                 # Database DDL scripts
├── public/              # Static assets
├── .env.local          # Environment variables (local only, .gitignored)
└── package.json        # Dependencies and scripts
```

---

## Common Development Tasks

### Add a new API endpoint

1. Create file: `app/api/myendpoint/route.ts`
2. Implement handler: `export function GET(request: NextRequest)`
3. Write tests in `tests/integration/myendpoint.test.ts`
4. Update API contract in `specs/001-url-click-analytics/contracts/`

### Create new component

1. Create file: `components/MyComponent.tsx` (React functional component)
2. Add tests: `tests/component/MyComponent.test.tsx`
3. Import and use in page/layout

### Add database migration

1. Create SQL script: `sql/migrations/001_add_xyz_field.sql`
2. Document in `data-model.md`
3. Test locally before deploying

### Update env variables

1. Add to `.env.example` (template for documentation)
2. Add to `.env.local` (local override, .gitignored)
3. Add to `.env.production` if different for production
4. Reference in `lib/constants.ts` or server-side functions

---

## Deployment

### Docker Build for Production

Build production image:

```bash
# Build image
docker build -t url-shortener:latest .

# Tag for registry (example: Docker Hub)
docker tag url-shortener:latest yourusername/url-shortener:latest

# Push to registry
docker push yourusername/url-shortener:latest
```

### Deploy with Docker Compose (Staging/Production)

For production deployment, create `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    restart: always

  app:
    image: yourusername/url-shortener:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: always

volumes:
  postgres_prod_data:
```

Deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel env add  # Set production environment variables
vercel           # Deploy main branch
```

Or connect GitHub → Vercel → auto-deploy on push

### Deploy to CloudFlare Workers (Edge Redirect, Optional)

```bash
npm install -D wrangler
wrangler init --ts

# Create separate function for redirects (performance optimization)
# Implement in wrangler.toml
wrangler deploy
```

### Production Checklist

- [ ] Database backups configured (automatic in Supabase or managed database)
- [ ] Environment variables set in deployment platform
- [ ] `NODE_ENV=production` enabled
- [ ] Docker image built and tested locally
- [ ] Error monitoring configured (e.g., Sentry)
- [ ] CORS headers set appropriately
- [ ] Rate limiting enabled (future feature)
- [ ] HTTPS enforced
- [ ] Tests passing locally and in CI

---

## CI/CD Pipeline (GitHub Actions Example)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npm run lint
      - run: npm run build
```

---

## Performance Optimization Tips

### Local Development

- Use `npm run dev` with `--turbopack` flag for faster builds (if using Next.js 14+)
- Use `--experimental-app-dir` if on older version

### Database

- Index frequently-queried columns (already done in schema.sql)
- Use connection pooling (Supabase PgBouncer handles this)
- Refresh materialized views nightly (see `sql/views.sql`)

### Frontend

- Lazy-load dashboard components
- Server-side paginate top links table
- Cache API responses with stale-while-revalidate

---

## Contributing Guidelines

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push to GitHub: `git push origin feature/your-feature`
4. Open Pull Request with description of changes
5. Ensure CI passes (tests, linting, build)
6. Request code review
7. Merge once approved

---

## Getting Help

- Check [docs/troubleshooting.md](../../docs/troubleshooting.md) (if exists)
- Search GitHub issues
- Ask in project Discussions or Discord channel
- File issue if reproducing a bug

---

## Next Steps

After local setup, start with:

1. **Phase 1 (Foundation)**: Implement short URL creation and redirect (User Story 1)
2. **Phase 2 (Tracking)**: Implement click tracking and per-link analytics (User Story 2)
3. **Phase 3 (Dashboard)**: Implement dashboard with trends and top links (User Story 3)

See `specs/001-url-click-analytics/tasks.md` for detailed task breakdown and dependencies.

Happy coding!

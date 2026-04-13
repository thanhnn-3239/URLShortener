# Docker Development Guide

This guide explains how to set up and use Docker for the URL Shortener project.

## Quick Start (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/URLShortener.git
cd URLShortener

# 2. Start services
docker-compose up -d

# 3. Open http://localhost:3000 in browser
```

Done! The app is running with PostgreSQL database automatically initialized.

---

## What's Included

The Docker setup includes:

- **Next.js App** (Node.js 18)
- **PostgreSQL 15** (database with schema auto-initialization)
- **PgAdmin** (optional, database UI)
- **Redis** (optional, for future caching features)

All services run in isolated containers with automatic networking and volume persistence.

---

## Services

### Running Services

```bash
# Start all core services (app + postgres)
docker-compose up -d

# Start with optional services (add pgadmin, redis)
docker-compose --profile dev up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
```

### Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Next.js App | http://localhost:3000 | - |
| PostgreSQL | localhost:5432 | user: postgres, pass: postgres |
| PgAdmin | http://localhost:5050 | admin@example.com / admin |

---

## Common Commands

### Database

```bash
# Access PostgreSQL CLI from container
docker-compose exec postgres psql -U postgres -d url_shortener

# Backup database
docker-compose exec postgres pg_dump -U postgres url_shortener > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d url_shortener
```

### Application

```bash
# View app logs in real-time
docker-compose logs -f app

# SSH into app container
docker-compose exec app sh

# Run npm commands
docker-compose exec app npm run test
docker-compose exec app npm run lint
docker-compose exec app npm run build
```

### Images & Cleanup

```bash
# Rebuild images (after dependency changes)
docker-compose build

# Rebuild and restart (fresh start)
docker-compose up -d --build

# Stop services
docker-compose down

# Stop and remove all data (BE CAREFUL!)
docker-compose down -v

# View image sizes
docker images | grep url-shortener
```

---

## Environment Variables

Edit `.env.docker` or create `docker-compose.override.yml` for custom settings:

### Via Environment File

```bash
# Using .env.docker
docker-compose --env-file .env.docker up -d

# Or rename to .env.local
cp .env.docker .env.local
docker-compose up -d
```

### Common Variables

```bash
# PostgreSQL
POSTGRES_DB=url_shortener
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Application
APP_PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/url_shortener

# Short URLs
SHORT_CODE_LENGTH=6
NEXT_PUBLIC_SHORT_URL_BASE=http://localhost:3000
```

---

## Customizing Services

### Use docker-compose.override.yml for Local Changes

This file is auto-loaded and gitignored:

```yaml
# docker-compose.override.yml
version: '3.9'

services:
  app:
    ports:
      - "3001:3000"  # Use different port
    environment:
      DEBUG: "true"   # Add debugging

  postgres:
    environment:
      POSTGRES_PASSWORD: "my-secure-password"  # Custom password
```

### Enable Optional Services

```bash
# Start with PgAdmin for database inspection
docker-compose --profile dev up -d

# Or in docker-compose.override.yml:
# services:
#   pgadmin:
#     profiles: [dev]  # Remove 'dev' to make always-on
```

---

## Troubleshooting

### PostgreSQL won't start

```bash
# View postgres logs
docker-compose logs postgres

# Check health
docker-compose ps postgres

# Force restart
docker-compose down postgres
docker-compose up -d postgres
```

### Port already in use

```bash
# Find what's using the port (example: port 3000)
lsof -i :3000

# Or change APP_PORT in environment:
APP_PORT=3001 docker-compose up -d
```

### Can't connect from app to postgres

```bash
# Verify network
docker network inspect url-shortener-network

# Test connection from app
docker-compose exec app psql -h postgres -U postgres -d url_shortener -c "SELECT 1"
```

### Need to clear everything and start fresh

```bash
# Stop and remove all data (DESTRUCTIVE!)
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```

---

## Development Workflow

### With Hot Reload

The default docker-compose.yml includes volume mounts for hot-reload:

```bash
npm run dev  # Inside app container or locally

# Changes to app/ components/ lib/ files auto-reload
# No container restart needed
```

### Running Tests in Docker

```bash
# Unit tests
docker-compose exec app npm run test

# Watch mode
docker-compose exec app npm run test:watch

# Coverage report
docker-compose exec app npm run test:coverage
```

### Database Migrations

Database schema auto-initializes on first run from `sql/schema.sql` and `sql/views.sql`.

For future migrations:

```bash
# Add new SQL file
sql/migrations/001_add_xyz_field.sql

# Run it
docker-compose exec postgres psql -U postgres -d url_shortener -f /docker-entrypoint-initdb.d/03_migrations.sql
```

---

## Production Deployment

### Build Production Image

```bash
# Build
docker build -t myrepo/url-shortener:v1.0.0 .

# Tag
docker tag myrepo/url-shortener:v1.0.0 myrepo/url-shortener:latest

# Push
docker push myrepo/url-shortener:latest
```

### Deploy to Cloud (Docker Swarm, Kubernetes, etc.)

Example Docker Swarm:

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml url-shortener

# View services
docker service ls
```

Example Kubernetes:

```bash
# Build and push image
docker build -t myrepo/url-shortener:latest .
docker push myrepo/url-shortener:latest

# Deploy using kubectl
kubectl apply -f k8s/deployment.yaml
```

---

## Best Practices

1. **Use named volumes for persistence**: Data survives container restarts
   ```bash
   docker-compose down  # Removes containers, keeps data
   docker-compose down -v  # Removes containers AND data
   ```

2. **Never commit sensitive data**: `.env.local`, `.env.docker`, passwords are gitignored

3. **Use health checks**: Services wait for dependencies before starting

4. **Layer your changes**: Use `docker-compose.override.yml` for local customizations

5. **Keep images lean**: The Dockerfile uses multi-stage builds to reduce image size

6. **Monitor logs**: Always check `docker-compose logs` when troubleshooting

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

---

## Getting Help

- Check logs: `docker-compose logs [service]`
- Inspect containers: `docker ps`, `docker inspect [container]`
- Ask in project issues or discussions
- Community: [Docker Community](https://forums.docker.com/)

Happy containerizing!

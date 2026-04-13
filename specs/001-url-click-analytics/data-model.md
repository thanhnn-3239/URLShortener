# Data Model: URL Shortener with Click Analytics

**Date**: 2026-04-13 | **Branch**: 001-add-url-click-analytics | **Status**: Complete

## Entity Relationship Diagram

```
┌─────────────────────┐
│   short_links       │
├─────────────────────┤
│ id (PK UUID)        │
│ code (UK)           │
│ destination_url     │
│ created_at          │
│ created_by (FK)     │
│ expires_at (NULL)   │
│ is_active           │
└──────────┬──────────┘
           │ (1:N)
           ├─→ ┌─────────────────────┐
           │   │   click_events      │
           │   ├─────────────────────┤
           │   │ id (PK UUID)        │
           │   │ short_link_id (FK)  │◄─┐
           │   │ clicked_at          │  │
           │   │ source (category)   │  │ (N:1)
           │   │ device (category)   │  │
           │   │ ip_hash (masked)    │  │
           │   │ user_agent_summary  │  │
           │   └─────────────────────┘  │
           │                             │
           └─────────────────────────────┘
                (N:1 via short_link_id)

┌──────────────────────────────────────┐
│ daily_clicks_mv (Materialized View)  │
├──────────────────────────────────────┤
│ date (from clicked_at)               │
│ short_link_id (FK)                   │
│ total_clicks                         │
│ clicks_by_source (JSON aggregate)    │
│ clicks_by_device (JSON aggregate)    │
│ top_devices (top 3)                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ weekly_clicks_mv (Materialized View) │
├──────────────────────────────────────┤
│ week_start_date                      │
│ short_link_id (FK)                   │
│ total_clicks                         │
│ clicks_by_source (JSON aggregate)    │
│ clicks_by_device (JSON aggregate)    │
└──────────────────────────────────────┘
```

---

## Entities

### 1. Short Link (Primary Entity)

**Purpose**: Represents the mapping from a generated short code to a destination URL.

**Table**: `short_links`

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for internal references |
| `code` | VARCHAR(8) | UNIQUE, NOT NULL | Human-friendly short code (Base62 encoded, 6-8 chars) |
| `destination_url` | TEXT | NOT NULL | Original URL that the short link points to |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When this short link was created |
| `created_by` | UUID | NOT NULL, FK users.id (if multi-user) | Creator of the short link |
| `expires_at` | TIMESTAMP | NULL, DEFAULT NULL | Optional expiration timestamp; NULL = no expiration |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft-delete flag (redirect returns 410 if false) |
| `click_count` | INTEGER | NOT NULL, DEFAULT 0 | Denormalized count for quick dashboard access (computed, not authoritative) |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE on `code` (required for fast lookups during redirect)
- BTREE on `created_at` (for sorting links by creation date)

**Validations**:
- `code`: Must be 6-8 alphanumeric characters (Base62), unique, not null
- `destination_url`: Must be valid HTTP/HTTPS URL, not null
- `created_by`: Must reference valid user ID (scope access control)
- `expires_at`: If set, must be >= current timestamp

**Sample Data**:
```sql
INSERT INTO short_links (code, destination_url, created_by) VALUES
  ('abc123', 'https://example.com/long-page-with-many-params', UUID()),
  ('def456', 'https://github.com/owner/repo', UUID());
```

---

### 2. Click Event (Transactional Entity)

**Purpose**: Represents a single valid click on a short link.

**Table**: `click_events`

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for event |
| `short_link_id` | UUID | NOT NULL, FK short_links.id | Reference to short link (foreign key) |
| `clicked_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When the click occurred |
| `source` | VARCHAR(50) | NOT NULL, DEFAULT 'unknown' | Source category (direct, referral, social, search, email, other, unknown) |
| `device` | VARCHAR(50) | NOT NULL, DEFAULT 'unknown' | Device category (mobile, desktop, tablet, unknown) |
| `ip_hash` | VARCHAR(64) | NULL | Hash of client IP (for duplicate detection, PII protection) |
| `user_agent_summary` | VARCHAR(255) | NULL | Truncated User-Agent string (for debugging, not PII) |

**Indexes**:
- PRIMARY KEY on `id`
- BTREE on `short_link_id` (for per-link analytics queries)
- BTREE on `clicked_at` (for time-range queries)
- COMPOSITE on (`short_link_id`, `clicked_at`) (for dashboard aggregation)

**Validations**:
- `short_link_id`: Must reference valid, active short link
- `clicked_at`: Must be <= current timestamp (disallow future dates)
- `source`: Must be one of allowed categories
- `device`: Must be one of allowed categories

**Cascade Behavior**:
- ON DELETE CASCADE from short_links (when link deleted, its events are removed)

**Sample Data**:
```sql
INSERT INTO click_events (short_link_id, source, device) VALUES
  (UUID(), 'direct', 'desktop'),
  (UUID(), 'social', 'mobile'),
  (UUID(), 'search', 'mobile');
```

---

### 3. Analytics Aggregates (Computed Views)

**Purpose**: Pre-computed daily and weekly click totals, enabling sub-second dashboard queries.

#### 3a. Daily Clicks Materialized View

**View**: `daily_clicks_mv`

Defined via:
```sql
CREATE MATERIALIZED VIEW daily_clicks_mv AS
SELECT
  DATE(e.clicked_at) as date,
  e.short_link_id,
  COUNT(*) as total_clicks,
  JSONB_OBJECT_AGG(e.source, COUNT(*) ORDER BY COUNT(*) DESC) as clicks_by_source,
  JSONB_OBJECT_AGG(e.device, COUNT(*) ORDER BY COUNT(*) DESC) as clicks_by_device
FROM click_events e
GROUP BY 1, 2;
```

**Purpose**: Serve dashboard daily totals without scanning click_events table.

**Refresh Strategy**:
- Refresh nightly (batch job at 2 AM UTC via cron/scheduler)
- OR refresh on-demand after bulk click insert (if near real-time needed)

#### 3b. Weekly Clicks Materialized View

**View**: `weekly_clicks_mv`

Defined via:
```sql
CREATE MATERIALIZED VIEW weekly_clicks_mv AS
SELECT
  DATE_TRUNC('week', e.clicked_at) as week_start_date,
  e.short_link_id,
  COUNT(*) as total_clicks,
  JSONB_OBJECT_AGG(e.source, COUNT(*) ORDER BY COUNT(*) DESC) as clicks_by_source,
  JSONB_OBJECT_AGG(e.device, COUNT(*) ORDER BY COUNT(*) DESC) as clicks_by_device
FROM click_events e
GROUP BY 1, 2;
```

**Refresh Strategy**: Same as daily view (nightly batch).

---

### 4. Dashboard View (Read Model / API Response)

**Purpose**: User-facing aggregation for dashboard rendering.

**Not a database table**, but a computed result returned by API endpoint `/api/dashboard`.

**Composition**:
- Date range (start_date, end_date) - user input
- Time bucketing (daily or weekly) - user selection
- Daily/weekly totals from materialized view
- Top links (sorted by total clicks DESC, limited to top 10-20)
- Click breakdown by source and device (aggregated across selected range)

**Sample Response**:
```json
{
  "date_range": {
    "start": "2026-03-13",
    "end": "2026-04-13",
    "bucket": "daily"
  },
  "series": [
    { "date": "2026-03-13", "clicks": 150, "top_source": "direct", "top_device": "desktop" },
    { "date": "2026-03-14", "clicks": 200, "top_source": "social", "top_device": "mobile" }
  ],
  "total_clicks": 6243,
  "top_links": [
    { "code": "abc123", "destination": "https://...", "clicks": 2105, "sources": {...}, "devices": {...} },
    { "code": "def456", "destination": "https://...", "clicks": 1850, "sources": {...}, "devices": {...} }
  ],
  "click_breakdown": {
    "by_source": { "direct": 2000, "social": 3000, "search": 1243 },
    "by_device": { "mobile": 3500, "desktop": 2500, "tablet": 243 }
  }
}
```

---

## Database Schema (SQL DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (if multi-user support needed)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Short links table
CREATE TABLE short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0,
  
  CONSTRAINT code_format CHECK (code ~ '^[0-9a-zA-Z]{6,8}$'),
  CONSTRAINT valid_url CHECK (destination_url LIKE 'http://%' OR destination_url LIKE 'https://%')
);

CREATE INDEX idx_short_links_code ON short_links(code);
CREATE INDEX idx_short_links_created_at ON short_links(created_at);
CREATE INDEX idx_short_links_created_by ON short_links(created_by);

-- Click events table
CREATE TABLE click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50) DEFAULT 'unknown',
  device VARCHAR(50) DEFAULT 'unknown',
  ip_hash VARCHAR(64) DEFAULT NULL,
  user_agent_summary VARCHAR(255) DEFAULT NULL,
  
  CONSTRAINT valid_source CHECK (source IN ('direct', 'referral', 'social', 'search', 'email', 'other', 'unknown')),
  CONSTRAINT valid_device CHECK (device IN ('mobile', 'desktop', 'tablet', 'unknown'))
);

CREATE INDEX idx_click_events_short_link_id ON click_events(short_link_id);
CREATE INDEX idx_click_events_clicked_at ON click_events(clicked_at);
CREATE INDEX idx_click_events_composite ON click_events(short_link_id, clicked_at);

-- Materialized views
CREATE MATERIALIZED VIEW daily_clicks_mv AS
SELECT
  DATE(e.clicked_at) as date,
  e.short_link_id,
  COUNT(*) as total_clicks,
  JSONB_OBJECT_AGG(e.source, COUNT(*)) as clicks_by_source,
  JSONB_OBJECT_AGG(e.device, COUNT(*)) as clicks_by_device
FROM click_events e
GROUP BY 1, 2;

CREATE INDEX idx_daily_clicks_mv_short_link_id ON daily_clicks_mv(short_link_id);
CREATE INDEX idx_daily_clicks_mv_date ON daily_clicks_mv(date);

CREATE MATERIALIZED VIEW weekly_clicks_mv AS
SELECT
  DATE_TRUNC('week', e.clicked_at)::DATE as week_start_date,
  e.short_link_id,
  COUNT(*) as total_clicks,
  JSONB_OBJECT_AGG(e.source, COUNT(*)) as clicks_by_source,
  JSONB_OBJECT_AGG(e.device, COUNT(*)) as clicks_by_device
FROM click_events e
GROUP BY 1, 2;

CREATE INDEX idx_weekly_clicks_mv_short_link_id ON weekly_clicks_mv(short_link_id);
CREATE INDEX idx_weekly_clicks_mv_date ON weekly_clicks_mv(week_start_date);
```

---

## Relationships & Integrity

| Relationship | Type | Constraint | Cascade |
|---|---|---|---|
| short_links → users (created_by) | N:1 | FK NOT NULL | ON DELETE CASCADE |
| click_events → short_links (short_link_id) | N:1 | FK NOT NULL | ON DELETE CASCADE |
| daily_clicks_mv → short_links | N:1 (derived) | View (no FK) | N/A |
| weekly_clicks_mv → short_links | N:1 (derived) | View (no FK) | N/A |

**Data Consistency**:
- All click_events must reference valid, active short_links
- Materialized views are eventually consistent (refreshed nightly)
- Denormalized `click_count` on short_links is updated asynchronously

---

## Sequence Diagrams

### URL Creation Flow
```
User Browser
    ↓
POST /api/shorten { destination_url }
    ↓
[validate URL]
    ↓
[generate Base62 code]
    ↓
INSERT short_links (code, destination_url, created_by)
    ↓
200 OK { short_code, short_url }
    ↓
User copies short URL
```

### Click Tracking Flow
```
User Browser
    ↓
GET /api/redirect/[code]
    ↓
SELECT short_links WHERE code = $1
    ↓
[increment denormalized click_count]
    ↓
INSERT click_events (short_link_id, source, device)
    ↓
302 REDIRECT to destination_url
    ↓
Browser loads destination_url
```

### Dashboard Query Flow
```
Dashboard Page
    ↓
GET /api/dashboard?start=YYYY-MM-DD&end=YYYY-MM-DD&bucket=daily
    ↓
SELECT FROM daily_clicks_mv WHERE date BETWEEN $1 AND $2 OR weekly_clicks_mv WHERE week_start_date...
    ↓
SELECT FROM short_links LIMIT 10 (for top links)
    ↓
Aggregate and format response JSON
    ↓
200 OK { series, top_links, click_breakdown }
    ↓
Dashboard renders chart + table
```

---

## Migration & Deployment

**Deployment Order**:
1. Create users table (if not exists)
2. Create short_links table with indexes
3. Create click_events table with indexes
4. Create materialized views (daily/weekly)
5. Create scheduled job for nightly view refresh

**Initial Data**:
- No seed data; tables start empty
- First short link creation triggers schema readiness

**Monitoring**:
- Track `click_events` row count growth
- Monitor materialized view refresh time (should be <1 minute)
- Alert if `short_links.click_count` diverges >1% from actual event count

```


# API Contract: Short URL Service

**Endpoint**: `/api/shorten`, `/api/redirect/[code]`, `/api/analytics/[code]`

---

## POST /api/shorten

**Purpose**: Create a new short URL mapping.

### Request

```json
{
  "destination_url": "https://www.example.com/some/very/long/url?param1=value1&param2=value2",
  "expires_at": "2026-12-31T23:59:59Z" // optional
}
```

**Validation Rules**:

- `destination_url`: Required, must be valid HTTP/HTTPS URL
- `expires_at`: Optional, if provided must be future timestamp

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "abc123",
  "short_url": "https://shrt.domain.com/abc123",
  "destination_url": "https://www.example.com/some/very/long/url?param1=value1&param2=value2",
  "created_at": "2026-04-13T10:30:00Z",
  "expires_at": "2026-12-31T23:59:59Z"
}
```

### Error Responses

**400 Bad Request** - Invalid or missing destination_url

```json
{
  "error": "invalid_url",
  "message": "Destination URL must be valid HTTP/HTTPS URL"
}
```

**409 Conflict** - Short code collision (after 3 retries)

```json
{
  "error": "code_generation_failed",
  "message": "Unable to generate unique short code after 3 attempts. Please try again."
}
```

**500 Internal Server Error** - Database error

```json
{
  "error": "internal_error",
  "message": "Failed to create short URL. Please try again later."
}
```

---

## GET /api/redirect/[code]

**Purpose**: Redirect to destination URL and record click event.

### Request

```
GET /api/redirect/abc123
Host: shrt.domain.com
User-Agent: Mozilla/5.0...
Referer: https://twitter.com/...  // optional
```

**URL Parameters**:

- `code`: Short code (6-8 alphanumeric characters)

### Response (302 Found)

```
Location: https://www.example.com/some/very/long/url?param1=value1&param2=value2
Cache-Control: no-cache
Set-Cookie: _shrt_rid=<request-id>; Path=/; HttpOnly; SameSite=Lax
```

**Side Effects**:

1. Record click event to click_events table
2. Increment short_links.click_count (denormalized counter)
3. Extract and classify source (direct, referral, social, search, etc.)
4. Extract and classify device (mobile, desktop, tablet, unknown)

### Error Responses

**404 Not Found** - Short code doesn't exist

```
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "not_found",
  "message": "Short URL not found"
}
```

**410 Gone** - Short URL expired or deleted

```
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "error": "expired",
  "message": "This short URL is no longer active"
}
```

**500 Internal Server Error** - Database error (still redirect on best-effort)

```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "internal_error",
  "message": "Redirect completed but click tracking failed. Please try again if redirects are slow."
}
```

---

## GET /api/analytics/[code]

**Purpose**: Get analytics summary for a specific short URL.

### Request

```
GET /api/analytics/abc123
Host: shrt.domain.com
```

**URL Parameters**:

- `code`: Short code (6-8 alphanumeric characters)

**Query Parameters**:

- `start_date`: ISO 8601 date (e.g., 2026-03-13) - optional, default: 30 days ago
- `end_date`: ISO 8601 date (e.g., 2026-04-13) - optional, default: today

### Response (200 OK)

```json
{
  "code": "abc123",
  "destination_url": "https://example.com/...",
  "created_at": "2026-03-01T12:00:00Z",
  "total_clicks": 1250,
  "period": {
    "start_date": "2026-03-13",
    "end_date": "2026-04-13"
  },
  "clicks_by_source": {
    "direct": 400,
    "social": 500,
    "search": 200,
    "referral": 100,
    "other": 50
  },
  "clicks_by_device": {
    "mobile": 700,
    "desktop": 500,
    "tablet": 50
  },
  "daily_trend": [
    { "date": "2026-03-13", "clicks": 42 },
    { "date": "2026-03-14", "clicks": 38 },
    ...
  ]
}
```

### Error Responses

**404 Not Found** - Short code doesn't exist

```json
{
  "error": "not_found",
  "message": "Short URL not found"
}
```

**400 Bad Request** - Invalid date parameters

```json
{
  "error": "invalid_params",
  "message": "start_date must be before end_date and within last 365 days"
}
```

---

## Common Error Format

All errors follow this format:

```json
{
  "error": "<error_code>",
  "message": "<human_readable_message>",
  "request_id": "<uuid>",
  "timestamp": "2026-04-13T10:30:00Z"
}
```

**Error Codes**:

- `invalid_url` - Malformed or unsupported URL
- `invalid_params` - Query/body parameters failed validation
- `not_found` - Resource doesn't exist
- `expired` - Resource has expired
- `code_generation_failed` - Could not generate unique short code
- `internal_error` - Server error (500)
- `service_unavailable` - Temporary unavailability (503)

---

## Rate Limiting

**Not yet implemented** (future enhancement)

Anticipated limits:

- Create short URL: 100 requests/hour per user
- Redirect: No limit (public endpoint)
- Analytics: 50 requests/minute per user

---

## Authentication

**Current**: None (public service)

**Future**:

- Bearer token JWT for protected endpoints (create, analytics, delete)
- Owner-only access to analytics for their own links
- Admin access to global dashboard statistics

---

## Response Headers

All responses include:

```
Content-Type: application/json; charset=utf-8
X-Request-ID: <uuid>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1681385400
Cache-Control: public, max-age=300  // for GET requests only
```

---

## Example cURL Commands

### Create short URL

```bash
curl -X POST https://shrt.domain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "destination_url": "https://www.example.com/long/url/here",
    "expires_at": "2026-12-31T23:59:59Z"
  }'
```

### Redirect (follows automatically)

```bash
curl -L https://shrt.domain.com/api/redirect/abc123
```

### Get analytics

```bash
curl "https://shrt.domain.com/api/analytics/abc123?start_date=2026-03-13&end_date=2026-04-13"
```

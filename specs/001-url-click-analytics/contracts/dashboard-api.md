# API Contract: Analytics Dashboard Service

**Endpoint**: `/api/dashboard`

---

## GET /api/dashboard

**Purpose**: Get aggregated analytics data for dashboard visualization and top links ranking.

### Request

```
GET /api/dashboard?start_date=2026-03-13&end_date=2026-04-13&bucket=daily
Host: shrt.domain.com
```

**Query Parameters**:

- `start_date`: ISO 8601 date (e.g., 2026-03-13) - required
- `end_date`: ISO 8601 date (e.g., 2026-04-13) - required, must be >= start_date
- `bucket`: Time bucketing ('daily' or 'weekly') - optional, default: 'daily'
- `limit`: Number of top links to return - optional, default: 20, max: 100

**Validation Rules**:

- `start_date` and `end_date` must be valid ISO 8601 dates
- `end_date` >= `start_date`
- Date range must not exceed 365 days
- `bucket` must be 'daily' or 'weekly'
- `limit` must be between 1 and 100

### Response (200 OK)

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-13T15:30:00Z",
  "period": {
    "start_date": "2026-03-13",
    "end_date": "2026-04-13",
    "bucket": "daily",
    "days_in_range": 32
  },
  "summary": {
    "total_clicks": 6243,
    "total_short_urls": 45,
    "avg_clicks_per_link": 138.7,
    "peak_day": {
      "date": "2026-04-10",
      "clicks": 320
    }
  },
  "series": [
    {
      "date": "2026-03-13",
      "clicks": 150,
      "breakdown_source": {
        "direct": 75,
        "social": 50,
        "search": 20,
        "referral": 5,
        "other": 0
      },
      "breakdown_device": {
        "mobile": 90,
        "desktop": 55,
        "tablet": 5
      }
    },
    {
      "date": "2026-03-14",
      "clicks": 165,
      "breakdown_source": {
        "direct": 80,
        "social": 60,
        "search": 20,
        "referral": 5,
        "other": 0
      },
      "breakdown_device": {
        "mobile": 100,
        "desktop": 60,
        "tablet": 5
      }
    }
  ],
  "top_links": [
    {
      "code": "abc123",
      "destination_url": "https://example.com/article-1",
      "total_clicks": 2105,
      "rank": 1,
      "percentage_of_total": 33.7,
      "source_breakdown": {
        "direct": 1000,
        "social": 800,
        "search": 200,
        "referral": 100,
        "other": 5
      },
      "device_breakdown": {
        "mobile": 1500,
        "desktop": 550,
        "tablet": 55
      },
      "created_at": "2026-02-01T00:00:00Z"
    },
    {
      "code": "def456",
      "destination_url": "https://example.com/product-page",
      "total_clicks": 1850,
      "rank": 2,
      "percentage_of_total": 29.6,
      "source_breakdown": {
        "direct": 800,
        "social": 700,
        "search": 250,
        "referral": 100,
        "other": 0
      },
      "device_breakdown": {
        "mobile": 1200,
        "desktop": 600,
        "tablet": 50
      },
      "created_at": "2026-02-15T00:00:00Z"
    }
  ],
  "aggregate_breakdown": {
    "source": {
      "direct": 2800,
      "social": 2100,
      "search": 800,
      "referral": 400,
      "email": 100,
      "other": 43
    },
    "device": {
      "mobile": 3800,
      "desktop": 2150,
      "tablet": 293
    }
  },
  "insights": {
    "peak_source": "direct",
    "peak_device": "mobile",
    "trend": "declining",
    "percent_change_vs_previous_period": -5.2
  }
}
```

### Response Fields Explanation

| Field                                        | Type     | Description                                           |
| -------------------------------------------- | -------- | ----------------------------------------------------- |
| `request_id`                                 | UUID     | Unique request identifier for debugging               |
| `timestamp`                                  | ISO 8601 | Server response time                                  |
| `period.start_date`                          | Date     | Query start date                                      |
| `period.end_date`                            | Date     | Query end date                                        |
| `period.bucket`                              | String   | 'daily' or 'weekly' bucketing                         |
| `period.days_in_range`                       | Integer  | Number of calendar days in range                      |
| `summary.total_clicks`                       | Integer  | Sum of all clicks in date range                       |
| `summary.total_short_urls`                   | Integer  | Number of distinct short URLs that received clicks    |
| `summary.avg_clicks_per_link`                | Float    | Average clicks per short URL                          |
| `summary.peak_day.date`                      | Date     | Highest click volume date                             |
| `summary.peak_day.clicks`                    | Integer  | Click count on peak day                               |
| `series[]`                                   | Array    | Time series data (one entry per day/week)             |
| `series[].date`                              | Date     | Bucket date (start of day/week)                       |
| `series[].clicks`                            | Integer  | Total clicks for this bucket                          |
| `series[].breakdown_source`                  | Object   | Clicks by source category                             |
| `series[].breakdown_device`                  | Object   | Clicks by device category                             |
| `top_links[]`                                | Array    | Top 20 links by click count (user configurable)       |
| `top_links[].code`                           | String   | Short code                                            |
| `top_links[].destination_url`                | String   | Original URL                                          |
| `top_links[].total_clicks`                   | Integer  | Total clicks across date range                        |
| `top_links[].rank`                           | Integer  | Ranking (1 = most clicks)                             |
| `top_links[].percentage_of_total`            | Float    | Percent of total clicks for this link                 |
| `top_links[].source_breakdown`               | Object   | Clicks by source for this link                        |
| `top_links[].device_breakdown`               | Object   | Clicks by device for this link                        |
| `top_links[].created_at`                     | ISO 8601 | When short URL was created                            |
| `aggregate_breakdown.source`                 | Object   | Total clicks by source across all links               |
| `aggregate_breakdown.device`                 | Object   | Total clicks by device across all links               |
| `insights.peak_source`                       | String   | Source category with highest clicks                   |
| `insights.peak_device`                       | String   | Device category with highest clicks                   |
| `insights.trend`                             | String   | 'rising' / 'declining' / 'stable'                     |
| `insights.percent_change_vs_previous_period` | Float    | Percent change from same period last reference window |

### Empty State Response (200 OK - No Data)

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-13T15:30:00Z",
  "period": {
    "start_date": "2026-03-13",
    "end_date": "2026-04-13",
    "bucket": "daily",
    "days_in_range": 32
  },
  "summary": {
    "total_clicks": 0,
    "total_short_urls": 0,
    "avg_clicks_per_link": 0,
    "peak_day": null
  },
  "series": [],
  "top_links": [],
  "aggregate_breakdown": {
    "source": {},
    "device": {}
  },
  "insights": {
    "peak_source": null,
    "peak_device": null,
    "trend": "no_data",
    "percent_change_vs_previous_period": null
  },
  "empty_state": {
    "status": "no_data",
    "message": "No click data available for the selected date range. Try extending the range or check if any short URLs are active."
  }
}
```

### Error Responses

**400 Bad Request** - Invalid query parameters

```json
{
  "error": "invalid_params",
  "message": "end_date must be greater than or equal to start_date",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**400 Bad Request** - Date range exceeds limit

```json
{
  "error": "invalid_range",
  "message": "Date range cannot exceed 365 days",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**500 Internal Server Error** - Database or processing error

```json
{
  "error": "internal_error",
  "message": "Failed to retrieve dashboard data. Please try again later.",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Performance Requirements

- **Response time p95**: < 3000ms (from spec SC-004)
- **Response time p50**: < 500ms (typical case)
- **Payload size**: < 500KB for 32-day range with 100 top links
- **Cache duration**: 300s (5 minutes) for same query parameters

### Caching Strategy

- Responses cacheable for 5 minutes if neither `start_date` nor `end_date` includes today
- Today's data refreshed every 60 seconds (near real-time)
- Cache key: MD5(endpoint + start_date + end_date + bucket + limit)

---

## Client Implementation Notes

### Dashboard Chart Rendering

The `series[]` array is intended for time-series visualization (line/bar chart), showing trend over time.

```javascript
// Example: React Chart.js component
const ChartData = {
  labels: response.series.map((s) => s.date),
  datasets: [
    {
      label: "Total Clicks",
      data: response.series.map((s) => s.clicks),
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1
    }
  ]
};
```

### Top Links Table Rendering

The `top_links[]` array is intended for table display with sorting/filtering capabilities. Click on a row to drill down to per-link analytics (`GET /api/analytics/[code]`).

### Empty State Handling

If `summary.total_clicks === 0`, render empty state message with suggestion to:

- Extend date range
- Check recent short URL creations
- Verify short URLs are being shared/accessed

---

## Rate Limiting

- Unauthenticated: 30 requests/minute IP
- Authenticated (future): 300 requests/minute per user

---

## Example cURL Command

```bash
curl "https://shrt.domain.com/api/dashboard?start_date=2026-03-13&end_date=2026-04-13&bucket=daily&limit=20" \
  -H "Accept: application/json"
```

---

## CORS Headers

Responses include CORS headers for browser requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

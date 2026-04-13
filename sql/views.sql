CREATE MATERIALIZED VIEW IF NOT EXISTS daily_clicks_mv AS
SELECT
  DATE(clicked_at) AS date,
  short_link_id,
  COUNT(*) AS total_clicks
FROM click_events
GROUP BY 1, 2;

CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_clicks_mv AS
SELECT
  DATE_TRUNC('week', clicked_at)::DATE AS week_start_date,
  short_link_id,
  COUNT(*) AS total_clicks
FROM click_events
GROUP BY 1, 2;

CREATE INDEX IF NOT EXISTS idx_daily_clicks_mv_short_link_id ON daily_clicks_mv(short_link_id);
CREATE INDEX IF NOT EXISTS idx_weekly_clicks_mv_short_link_id ON weekly_clicks_mv(short_link_id);

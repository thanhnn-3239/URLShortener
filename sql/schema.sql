CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  click_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT code_format CHECK (code ~ '^[0-9a-zA-Z]{6,8}$'),
  CONSTRAINT valid_url CHECK (destination_url LIKE 'http://%' OR destination_url LIKE 'https://%')
);

CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50) NOT NULL DEFAULT 'unknown',
  device VARCHAR(50) NOT NULL DEFAULT 'unknown',
  ip_hash VARCHAR(64),
  user_agent_summary VARCHAR(255),
  CONSTRAINT valid_source CHECK (source IN ('direct', 'referral', 'social', 'search', 'email', 'other', 'unknown')),
  CONSTRAINT valid_device CHECK (device IN ('mobile', 'desktop', 'tablet', 'unknown'))
);

CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code);
CREATE INDEX IF NOT EXISTS idx_click_events_short_link_id ON click_events(short_link_id);
CREATE INDEX IF NOT EXISTS idx_click_events_short_link_id_clicked_at ON click_events(short_link_id, clicked_at);

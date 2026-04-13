export type SourceType = "direct" | "referral" | "social" | "search" | "email" | "other" | "unknown";
export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ShortLink {
  id: string;
  code: string;
  destination_url: string;
  created_at: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  click_count: number;
}

export interface ClickEvent {
  id: string;
  short_link_id: string;
  clicked_at: string;
  source: SourceType;
  device: DeviceType;
  ip_hash: string | null;
  user_agent_summary: string | null;
}

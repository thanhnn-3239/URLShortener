import { createHash, randomUUID } from "node:crypto";
import { insert } from "@/lib/database";
import { parseDeviceSource as classifyDeviceSource } from "@/lib/validation";
import type { ClickEvent } from "@/lib/types";

type DbRow = Record<string, string | number | boolean | null>;

const CLICK_EVENTS_TABLE = "click_events";

type RecordClickOptions = {
  clickedAt?: string;
  ip?: string | null;
  referer?: string | null;
  userAgent?: string | null;
};

function summarizeUserAgent(userAgent?: string | null): string | null {
  if (!userAgent) {
    return null;
  }

  return userAgent.slice(0, 255);
}

function hashIp(ip?: string | null): string | null {
  if (!ip) {
    return null;
  }

  return createHash("sha256").update(ip).digest("hex");
}

export function parseDeviceSource(
  userAgent?: string | null,
  referer?: string | null
) {
  return classifyDeviceSource(userAgent, referer);
}

export async function recordClick(
  shortLinkId: string,
  options: RecordClickOptions = {}
): Promise<ClickEvent> {
  const classification = parseDeviceSource(options.userAgent, options.referer);

  const clickEvent: ClickEvent = {
    id: randomUUID(),
    short_link_id: shortLinkId,
    clicked_at: options.clickedAt ?? new Date().toISOString(),
    source: classification.source,
    device: classification.device,
    ip_hash: hashIp(options.ip),
    user_agent_summary: summarizeUserAgent(options.userAgent)
  };

  await insert(CLICK_EVENTS_TABLE, clickEvent as unknown as DbRow);

  return clickEvent;
}

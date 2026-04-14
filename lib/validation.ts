import { VALID_DEVICES, VALID_SOURCES } from "@/lib/constants";
import type { DeviceType, SourceType } from "@/lib/types";

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseDeviceSource(
  userAgent?: string | null,
  referer?: string | null
): {
  device: DeviceType;
  source: SourceType;
} {
  const ua = (userAgent ?? "").toLowerCase();
  let device: DeviceType = "unknown";

  if (/ipad|tablet/.test(ua)) {
    device = "tablet";
  } else if (/mobile|iphone|android/.test(ua)) {
    device = "mobile";
  } else if (ua.length > 0) {
    device = "desktop";
  }

  let source: SourceType = "direct";
  const ref = (referer ?? "").toLowerCase();

  if (!ref) {
    source = "direct";
  } else if (/google|bing|duckduckgo|yahoo/.test(ref)) {
    source = "search";
  } else if (/facebook|twitter|x\.com|instagram|linkedin|tiktok/.test(ref)) {
    source = "social";
  } else if (/mail|gmail|outlook/.test(ref)) {
    source = "email";
  } else {
    source = "referral";
  }

  if (!VALID_DEVICES.includes(device)) {
    device = "unknown";
  }

  if (!VALID_SOURCES.includes(source)) {
    source = "unknown";
  }

  return { device, source };
}

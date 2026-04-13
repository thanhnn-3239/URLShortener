export const SHORT_CODE_LENGTH = Number(process.env.SHORT_CODE_LENGTH ?? 6);
export const BASE_URL = process.env.NEXT_PUBLIC_SHORT_URL_BASE ?? "http://localhost:3000";

export const VALID_SOURCES = ["direct", "referral", "social", "search", "email", "other", "unknown"] as const;
export const VALID_DEVICES = ["mobile", "desktop", "tablet", "unknown"] as const;

import { randomUUID } from "node:crypto";
import { SHORT_CODE_LENGTH } from "@/lib/constants";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { generateShortCode } from "@/lib/shortCode";
import type { ShortLink } from "@/lib/types";
import { validateUrl } from "@/lib/validation";
import { insert, select, update } from "@/lib/database";

type DbShortLink = {
  id: string;
  code: string;
  destination_url: string;
  created_at: string;
  created_by: string | null;
  expires_at: string | null;
  is_active: boolean;
  click_count: number;
};

const SHORT_LINK_TABLE = "short_links";
const incrementLocks = new Map<string, Promise<void>>();

function toShortLink(row: DbShortLink): ShortLink {
  return {
    id: row.id,
    code: row.code,
    destination_url: row.destination_url,
    created_at: row.created_at,
    created_by: row.created_by ?? "anonymous",
    expires_at: row.expires_at,
    is_active: row.is_active,
    click_count: row.click_count
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function createShortUrl(
  destinationUrl: string,
  options?: { createdBy?: string | null; expiresAt?: string | null }
): Promise<ShortLink> {
  if (!validateUrl(destinationUrl)) {
    throw new ValidationError("Destination URL must be valid HTTP/HTTPS URL");
  }

  const createdBy = options?.createdBy ?? null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = generateShortCode(SHORT_CODE_LENGTH);
    const existing = (await select(SHORT_LINK_TABLE, {
      code
    })) as DbShortLink[];

    if (existing.length > 0) {
      continue;
    }

    const row: DbShortLink = {
      id: randomUUID(),
      code,
      destination_url: destinationUrl,
      created_at: nowIso(),
      created_by: createdBy,
      expires_at: options?.expiresAt ?? null,
      is_active: true,
      click_count: 0
    };

    await insert(SHORT_LINK_TABLE, row);
    return toShortLink(row);
  }

  throw new ConflictError(
    "Unable to generate unique short code after 3 attempts. Please try again."
  );
}

export async function resolveShortUrl(code: string): Promise<ShortLink> {
  const found = (await select(SHORT_LINK_TABLE, { code })) as DbShortLink[];
  const row = found[0];

  if (!row || !row.is_active) {
    throw new NotFoundError("Short URL not found");
  }

  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    throw new NotFoundError("Short URL not found");
  }

  return toShortLink(row);
}

export async function incrementClickCount(code: string): Promise<void> {
  const previous = incrementLocks.get(code) ?? Promise.resolve();
  const next = previous.then(async () => {
    const found = (await select(SHORT_LINK_TABLE, { code })) as DbShortLink[];
    const row = found[0];

    if (!row) {
      return;
    }

    await update(
      SHORT_LINK_TABLE,
      { code },
      { click_count: row.click_count + 1 }
    );
  });

  incrementLocks.set(
    code,
    next.catch(() => undefined)
  );
  await next;
}

function resolveBaseUrl(requestUrl?: string): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_SHORT_URL_BASE;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (requestUrl) {
    try {
      return new URL(requestUrl).origin;
    } catch {
      // ignore invalid URL input and continue fallback chain
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function buildShortUrl(code: string, requestUrl?: string): string {
  return `${resolveBaseUrl(requestUrl)}/${code}`;
}

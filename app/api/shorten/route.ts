import { createShortUrl, buildShortUrl } from "@/services/shortUrl";
import { handleApiError } from "@/services/errorHandler";
import { successResponse } from "@/lib/response";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { destination_url?: string };
    const shortLink = await createShortUrl(body.destination_url ?? "");

    logger.info("short_url_created", {
      code: shortLink.code,
      destination_url: shortLink.destination_url
    });

    return successResponse(
      {
        id: shortLink.id,
        code: shortLink.code,
        short_url: buildShortUrl(shortLink.code),
        destination_url: shortLink.destination_url,
        created_at: shortLink.created_at,
        expires_at: shortLink.expires_at
      },
      201
    );
  } catch (error) {
    logger.error("short_url_create_failed", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
    return handleApiError(error);
  }
}

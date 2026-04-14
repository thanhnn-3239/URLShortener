import { createShortUrl, buildShortUrl } from "@/services/shortUrl";
import { handleApiError, parseJsonBody } from "@/services/errorHandler";
import { successResponse } from "@/lib/response";
import { logger } from "@/lib/logger";
import { withRequestLogging } from "@/lib/apiMiddleware";
import { checkRateLimit } from "@/lib/rateLimit";

const SHORTEN_RATE_LIMIT_ENABLED =
  process.env.ENABLE_SHORTEN_RATE_LIMIT === "1" ||
  process.env.ENABLE_SHORTEN_RATE_LIMIT === "true";
const SHORTEN_RATE_LIMIT_MAX = 100;
const SHORTEN_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getRequesterIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export const POST = withRequestLogging(
  "shorten_post",
  async (request: Request) => {
    try {
      if (SHORTEN_RATE_LIMIT_ENABLED) {
        const requesterIp = getRequesterIp(request);
        const rateLimit = checkRateLimit(
          `shorten:${requesterIp}`,
          SHORTEN_RATE_LIMIT_MAX,
          SHORTEN_RATE_LIMIT_WINDOW_MS
        );

        if (!rateLimit.allowed) {
          return new Response(
            JSON.stringify({
              error: "rate_limit_exceeded",
              message: "Too many requests. Please try again later.",
              timestamp: new Date().toISOString()
            }),
            {
              status: 429,
              headers: {
                "content-type": "application/json",
                "retry-after": String(Math.ceil(rateLimit.retryAfterMs / 1000))
              }
            }
          );
        }
      }

      const body = await parseJsonBody<{ destination_url?: string }>(request);
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
);

import { NextResponse } from "next/server";
import { incrementClickCount, resolveShortUrl } from "@/services/shortUrl";
import { recordClick } from "@/services/clickTracking";
import { logger } from "@/lib/logger";
import { withRequestLogging } from "@/lib/apiMiddleware";
import { handleApiError, assertOrThrow } from "@/services/errorHandler";

type RouteContext = {
  params: {
    code: string;
  };
};

export const GET = withRequestLogging<Request, RouteContext>(
  "redirect_get",
  async (request, context) => {
    try {
      assertOrThrow(Boolean(context?.params?.code), "Short code is required");
      const shortLink = await resolveShortUrl(context!.params.code);
      await incrementClickCount(shortLink.code);
      const clickEvent = await recordClick(shortLink.id, {
        referer: request.headers.get("referer"),
        userAgent: request.headers.get("user-agent"),
        ip: request.headers.get("x-forwarded-for")
      });

      logger.info("short_url_redirected", {
        code: shortLink.code,
        destination_url: shortLink.destination_url,
        source: clickEvent.source,
        device: clickEvent.device,
        clicked_at: clickEvent.clicked_at,
        ip_hash: clickEvent.ip_hash
      });

      return NextResponse.redirect(shortLink.destination_url, { status: 302 });
    } catch (error) {
      logger.error("short_url_redirect_failed", {
        code: context?.params?.code ?? "",
        error: error instanceof Error ? error.message : "unknown_error"
      });
      return handleApiError(error);
    }
  }
);

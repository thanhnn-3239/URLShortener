import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/response";
import { incrementClickCount, resolveShortUrl } from "@/services/shortUrl";
import { recordClick } from "@/services/clickTracking";
import { logger } from "@/lib/logger";

type RouteContext = {
  params: {
    code: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const shortLink = await resolveShortUrl(context.params.code);
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
  } catch {
    logger.error("short_url_redirect_failed", {
      code: context.params.code
    });
    return errorResponse("not_found", "Short URL not found", 404);
  }
}

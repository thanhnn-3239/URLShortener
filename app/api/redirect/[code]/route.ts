import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/response";
import { incrementClickCount, resolveShortUrl } from "@/services/shortUrl";

type RouteContext = {
  params: {
    code: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const shortLink = await resolveShortUrl(context.params.code);
    await incrementClickCount(shortLink.code);
    return NextResponse.redirect(shortLink.destination_url, { status: 302 });
  } catch {
    return errorResponse("not_found", "Short URL not found", 404);
  }
}

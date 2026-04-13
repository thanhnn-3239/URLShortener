import { createShortUrl, buildShortUrl } from "@/services/shortUrl";
import { handleApiError } from "@/services/errorHandler";
import { successResponse } from "@/lib/response";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { destination_url?: string };
    const shortLink = await createShortUrl(body.destination_url ?? "");

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
    return handleApiError(error);
  }
}

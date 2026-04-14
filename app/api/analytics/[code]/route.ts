import { handleApiError, assertOrThrow } from "@/services/errorHandler";
import { getPerLinkStats } from "@/services/analytics";
import { successResponse } from "@/lib/response";
import { withRequestLogging } from "@/lib/apiMiddleware";

type RouteContext = {
  params: {
    code: string;
  };
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getDateRange(url: URL) {
  const endDate = url.searchParams.get("end_date") ?? toIsoDate(new Date());
  const startDate =
    url.searchParams.get("start_date") ??
    toIsoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return { startDate, endDate };
}

export const GET = withRequestLogging<Request, RouteContext>(
  "analytics_get",
  async (request, context) => {
    try {
      assertOrThrow(Boolean(context?.params?.code), "Short code is required");
      const dateRange = getDateRange(new URL(request.url));
      const stats = await getPerLinkStats(context!.params.code, dateRange);
      return successResponse(stats);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

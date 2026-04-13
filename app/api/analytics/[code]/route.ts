import { handleApiError } from "@/services/errorHandler";
import { getPerLinkStats } from "@/services/analytics";
import { successResponse } from "@/lib/response";

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
    url.searchParams.get("start_date") ?? toIsoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return { startDate, endDate };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const dateRange = getDateRange(new URL(request.url));
    const stats = await getPerLinkStats(context.params.code, dateRange);
    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

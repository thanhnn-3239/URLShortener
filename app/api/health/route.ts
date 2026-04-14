import { successResponse } from "@/lib/response";
import { withRequestLogging } from "@/lib/apiMiddleware";

export const GET = withRequestLogging("health_get", async () => {
  return successResponse({ status: "ok" });
});

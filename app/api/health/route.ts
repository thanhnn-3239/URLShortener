import { successResponse } from "@/lib/response";

export async function GET() {
  return successResponse({ status: "ok" });
}

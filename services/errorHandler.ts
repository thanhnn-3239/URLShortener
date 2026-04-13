import { AppError, toAppError } from "@/lib/errors";
import { errorResponse } from "@/lib/response";

export function handleApiError(error: unknown) {
  const appError = toAppError(error);
  return errorResponse(appError.code, appError.message, appError.statusCode);
}

export function assertOrThrow(condition: boolean, message: string, code = "invalid_params", statusCode = 400) {
  if (!condition) {
    throw new AppError(message, code, statusCode);
  }
}

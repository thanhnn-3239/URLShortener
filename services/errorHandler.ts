import { AppError, ValidationError, toAppError } from "@/lib/errors";
import { errorResponse } from "@/lib/response";

export function handleApiError(error: unknown) {
  const appError = toAppError(error);
  return errorResponse(appError.code, appError.message, appError.statusCode);
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
}

export function assertOrThrow(
  condition: boolean,
  message: string,
  code = "invalid_params",
  statusCode = 400
) {
  if (!condition) {
    throw new AppError(message, code, statusCode);
  }
}

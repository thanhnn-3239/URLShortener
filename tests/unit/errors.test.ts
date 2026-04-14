import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
  toAppError
} from "@/lib/errors";

describe("error classes", () => {
  it("creates specialized application errors with expected defaults", () => {
    const validation = new ValidationError("Invalid payload", { field: "url" });
    const notFound = new NotFoundError();
    const conflict = new ConflictError();

    expect(validation).toBeInstanceOf(AppError);
    expect(validation.code).toBe("invalid_params");
    expect(validation.statusCode).toBe(400);
    expect(validation.details).toEqual({ field: "url" });

    expect(notFound.message).toBe("Resource not found");
    expect(notFound.code).toBe("not_found");
    expect(notFound.statusCode).toBe(404);

    expect(conflict.message).toBe("Resource conflict");
    expect(conflict.code).toBe("conflict");
    expect(conflict.statusCode).toBe(409);
  });
});

describe("toAppError", () => {
  it("returns existing AppError instances unchanged", () => {
    const error = new AppError("boom", "custom", 418);

    expect(toAppError(error)).toBe(error);
  });

  it("maps SyntaxError to ValidationError", () => {
    const error = toAppError(new SyntaxError("Unexpected token"));

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("Invalid JSON body");
  });

  it("maps generic Error to internal AppError", () => {
    const error = toAppError(new Error("db offline"));

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("internal_error");
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("db offline");
  });

  it("maps unknown values to a default internal AppError", () => {
    const error = toAppError({ reason: "unexpected" });

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("internal_error");
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("Unexpected error");
    expect(error.details).toEqual({ reason: "unexpected" });
  });
});

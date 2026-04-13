import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(code: string, message: string, status = 500) {
  return NextResponse.json(
    {
      error: code,
      message,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

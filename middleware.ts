import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";

const CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN ?? "*";
const CORS_ALLOW_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOW_HEADERS = "Content-Type,Authorization,X-Requested-With";

/**
 * IMPORTANT: Environment validation happens at module import time (app startup),
 * NOT per-request in this middleware. The validation is triggered when lib/database.ts
 * is first imported. This ensures fail-fast behavior on misconfiguration:
 *
 * 1. App starts → Next.js initializes → lib/database imports validateEnvironment()
 * 2. If env is invalid, app fails to start (startup error, not per-request)
 * 3. If env is valid, app initializes successfully
 * 4. This middleware runs for each request but validation already happened
 *
 * See: lib/envValidation.ts, lib/database.ts
 */

function applyStandardHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN);
  response.headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  response.headers.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  response.headers.set("Access-Control-Max-Age", "86400");

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
  );
}

export function middleware(request: NextRequest) {
  const startedAt = Date.now();
  const response =
    request.method === "OPTIONS"
      ? new NextResponse(null, { status: 204 })
      : NextResponse.next();

  logger.info("middleware_request", {
    method: request.method,
    path: request.nextUrl.pathname,
    duration_ms: Date.now() - startedAt
  });

  applyStandardHeaders(response);
  response.headers.set("x-request-start", String(startedAt));
  return response;
}

export const config = {
  matcher: ["/api/:path*"]
};

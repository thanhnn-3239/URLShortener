import { logger } from "@/lib/logger";
import { ConfigurationError } from "@/lib/errors";

type RouteContext = Record<string, unknown> | undefined;

type RouteHandler<
  TRequest extends Request = Request,
  TContext extends RouteContext = RouteContext
> = (request: TRequest, context?: TContext) => Promise<Response>;

/**
 * Wraps a route handler with environment validation error catching
 * Returns 503 Service Unavailable with structured error response if ConfigurationError occurs
 */
export function withErrorHandling<
  TRequest extends Request = Request,
  TContext extends RouteContext = RouteContext
>(
  operation: string,
  handler: RouteHandler<TRequest, TContext>
): RouteHandler<TRequest, TContext> {
  return async (request: TRequest, context?: TContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        logger.error("configuration_error", {
          operation,
          code: error.configCode,
          variable: error.variable,
          severity: error.severity
        });

        const errorResponse = {
          error: {
            code: error.configCode,
            message:
              error.message ||
              "Deployment configuration is invalid. Please check environment variables.",
            status: 503,
            timestamp: new Date().toISOString(),
            hint:
              error.hint ||
              "Check the health endpoint (GET /api/health) for details.",
            details: {
              validation: "invalid",
              contactURL: "/api/health"
            }
          },
          requestId: crypto.randomUUID?.() || `req_${Date.now()}`
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        });
      }

      // Re-throw if not a ConfigurationError
      throw error;
    }
  };
}

export function withRequestLogging<
  TRequest extends Request = Request,
  TContext extends RouteContext = RouteContext
>(
  operation: string,
  handler: RouteHandler<TRequest, TContext>
): RouteHandler<TRequest, TContext> {
  return async (request: TRequest, context?: TContext) => {
    const start = Date.now();
    const url = new URL(request.url);

    logger.info("api_request", {
      operation,
      method: request.method,
      path: url.pathname
    });

    const response = await handler(request, context);

    logger.info("api_response", {
      operation,
      method: request.method,
      path: url.pathname,
      status: response.status,
      duration_ms: Date.now() - start
    });

    return response;
  };
}

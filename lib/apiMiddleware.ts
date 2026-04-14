import { logger } from "@/lib/logger";

type RouteContext = Record<string, unknown> | undefined;

type RouteHandler<
  TRequest extends Request = Request,
  TContext extends RouteContext = RouteContext
> = (request: TRequest, context?: TContext) => Promise<Response>;

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

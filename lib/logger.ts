type LogLevel = "info" | "error";

const SENSITIVE_KEY_PATTERN =
  /(^|_)(password|passwd|secret|token|authorization|cookie|api[_-]?key|ip|ip_hash)($|_)/i;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return sanitizeMeta(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeMeta(meta: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return [key, "[REDACTED]"];
      }

      return [key, sanitizeValue(value)];
    })
  );
}

function write(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) {
  const sanitizedMeta = meta ? sanitizeMeta(meta) : undefined;
  const payload = sanitizedMeta ? { message, ...sanitizedMeta } : { message };
  const timestamp = new Date().toISOString();

  if (level === "error") {
    console.error(`[${timestamp}] ${message}`, payload);
    return;
  }

  console.info(`[${timestamp}] ${message}`, payload);
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    write("info", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    write("error", message, meta);
  }
};

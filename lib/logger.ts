type LogLevel = "info" | "error";

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { message, ...meta } : { message };
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

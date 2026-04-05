import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

/**
 * Server-only structured logger (API routes, server actions, `lib/server/*`).
 * Do not import from `proxy.ts` or client components.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});

export function createRequestLogger(requestId: string, path: string) {
  return logger.child({ requestId, path });
}

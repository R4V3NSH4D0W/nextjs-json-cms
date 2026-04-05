import type { NextRequest } from "next/server";

function parseOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    const fallback = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return [fallback];
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Returns the origin to echo in `Access-Control-Allow-Origin`, or `null` if the request must be rejected.
 * Requests without an `Origin` header (same-origin navigation, curl, server-to-server) are allowed.
 */
export function resolveCorsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  const allowed = parseOrigins();
  if (allowed.includes("*")) {
    return origin;
  }
  if (allowed.includes(origin)) {
    return origin;
  }
  return null;
}

export function corsHeaders(
  request: NextRequest,
  requestId: string,
): { headers: Headers; blocked: boolean } {
  const headers = new Headers();
  const resolved = resolveCorsOrigin(request);
  if (!resolved) {
    return { headers, blocked: true };
  }
  headers.set("Access-Control-Allow-Origin", resolved);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Request-Id",
  );
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("X-Request-Id", requestId);
  return { headers, blocked: false };
}

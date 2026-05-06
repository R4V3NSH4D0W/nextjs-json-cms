/**
 * Next.js 16 `proxy.ts` — runs on the Node.js runtime before routes complete.
 * Handles rate limiting and request IDs.
 *
 * CORS is handled by the Hono backend itself (via hono/cors middleware).
 * The Next.js rewrite forwards /api/* to Hono, so we deliberately skip
 * adding CORS headers here to avoid conflicts with Hono's own headers.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkRateLimit } from "@/lib/middleware/rate-limit";

function normalizeHost(rawHost: string) {
  return rawHost.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

function tenantSlugFromHost(rawHost: string) {
  const host = normalizeHost(rawHost);
  const parts = host.split(".");
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    return parts[0]?.trim() || "";
  }
  return "";
}

export async function proxy(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ?? crypto.randomUUID();
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    // Rate-limit all /api/* traffic (applies before the rewrite to Hono hits)
    const limit = await checkRateLimit(request);
    if (!limit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(limit.retryAfter),
            "X-Request-Id": requestId,
          },
        },
      );
    }
  }

  // Forward X-Request-Id on every request so server logs can correlate
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const incomingHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  if (incomingHost) {
    requestHeaders.set("x-forwarded-host", incomingHost);
    const tenantSlug = tenantSlugFromHost(incomingHost);
    if (tenantSlug) {
      requestHeaders.set("x-tenant-slug", tenantSlug);
    }
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

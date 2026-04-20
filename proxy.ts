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
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

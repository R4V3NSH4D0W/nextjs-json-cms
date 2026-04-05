/**
 * Next.js 16 `proxy.ts` — runs on the Node.js runtime before routes complete.
 * Handles CORS + rate limiting + request IDs for `/api/*`, and dashboard access checks.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { corsHeaders } from "@/lib/middleware/cors";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

export async function proxy(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ?? crypto.randomUUID();
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      const { headers, blocked } = corsHeaders(request, requestId);
      if (blocked) {
        return new NextResponse(null, { status: 403 });
      }
      return new NextResponse(null, { status: 204, headers });
    }

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

    const { headers: corsH, blocked } = corsHeaders(request, requestId);
    if (blocked) {
      return new NextResponse(
        JSON.stringify({ error: "Origin not allowed" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": requestId,
          },
        },
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-request-id", requestId);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    corsH.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

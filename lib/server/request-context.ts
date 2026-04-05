import type { NextRequest } from "next/server";

import { getClientIp } from "@/lib/http/client-ip";

export { getClientIp };

/** Propagated by root `proxy.ts` on every matched request. */
export function getRequestId(request: NextRequest): string {
  return request.headers.get("x-request-id") ?? "unknown";
}

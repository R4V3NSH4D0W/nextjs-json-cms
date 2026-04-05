import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

import { getClientIp } from "@/lib/http/client-ip";

let limiterInstance: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiterInstance !== undefined) {
    return limiterInstance;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiterInstance = null;
    return null;
  }
  const redis = new Redis({ url, token });
  const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);
  const max = Number(process.env.RATE_LIMIT_MAX ?? 100);
  limiterInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
    prefix: "cms",
    analytics: true,
  });
  return limiterInstance;
}

/**
 * Distributed rate limit (runs from `proxy.ts` on Node). Requires Upstash Redis env vars.
 * If unset, returns `allowed: true` (local dev / single-region without Redis).
 */
export async function checkRateLimit(
  request: NextRequest,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const limiter = getLimiter();
  if (!limiter) {
    return { allowed: true };
  }
  const id = getClientIp(request);
  const { success, reset } = await limiter.limit(id);
  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

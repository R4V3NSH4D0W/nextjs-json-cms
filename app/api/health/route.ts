import { type NextRequest, NextResponse } from "next/server";

import { getDbStatus } from "@/lib/server/db";
import { createRequestLogger } from "@/lib/server/logger";
import { getClientIp, getRequestId } from "@/lib/server/request-context";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, "/api/health");
  log.debug({ clientIp: getClientIp(request) }, "health");

  const database = await getDbStatus();

  return NextResponse.json({
    ok: true,
    service: "cms",
    timestamp: new Date().toISOString(),
    database,
  });
}

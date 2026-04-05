import { NextResponse } from "next/server";

/**
 * Versioned API namespace. Add nested routes under `app/api/v1/...`.
 */
export function GET() {
  return NextResponse.json({
    version: "v1",
    message: "API root — add route handlers in app/api/v1/",
  });
}

import { NextResponse } from "next/server";

import { cmsService } from "@/lib/server/cms-service";

export async function GET() {
  const pages = await cmsService.listPublicPages();
  return NextResponse.json({ success: true, pages });
}

import { NextResponse } from "next/server";

import { buildPublicSiteChromeFlatResponse } from "@/lib/server/cms-public-site-chrome-flat";
import { cmsService } from "@/lib/server/cms-service";

export async function GET() {
  const raw = await cmsService.getFooterConfig();
  return NextResponse.json(buildPublicSiteChromeFlatResponse(raw, "footer"));
}

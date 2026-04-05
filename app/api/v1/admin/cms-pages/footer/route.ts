import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import { cmsService } from "@/lib/server/cms-service";

export async function GET() {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const footer = await cmsService.getFooterConfig();
  return NextResponse.json({ success: true, footer });
}

export async function PUT(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const footer = await cmsService.putFooterConfig(body);
    return NextResponse.json({ success: true, footer });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

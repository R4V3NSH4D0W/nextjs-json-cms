import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import { cmsService } from "@/lib/server/cms-service";

export async function GET() {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const announcements = await cmsService.getAnnouncementsConfig();
  return NextResponse.json({ success: true, announcements });
}

export async function PUT(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const announcements = await cmsService.putAnnouncementsConfig(body);
    return NextResponse.json({ success: true, announcements });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import { cmsService } from "@/lib/server/cms-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { pageId } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const type = typeof body.type === "string" ? body.type : "";
    if (!type) {
      return NextResponse.json(
        { success: false, message: "type is required" },
        { status: 400 },
      );
    }
    const block = await cmsService.createBlock(pageId, {
      type,
      config: body.config,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });
    if (!block) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, block }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

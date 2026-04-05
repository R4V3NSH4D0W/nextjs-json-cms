import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import { cmsService } from "@/lib/server/cms-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ blockId: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { blockId } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data: Parameters<typeof cmsService.updateBlock>[1] = {};
    if (body.type !== undefined) data.type = String(body.type);
    if (body.config !== undefined) data.config = body.config;
    if (body.displayOrder !== undefined) {
      const n = Number(body.displayOrder);
      if (!Number.isFinite(n)) {
        return NextResponse.json(
          { success: false, message: "displayOrder must be a number" },
          { status: 400 },
        );
      }
      data.displayOrder = n;
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { success: false, message: "isActive must be boolean" },
          { status: 400 },
        );
      }
      data.isActive = body.isActive;
    }

    const block = await cmsService.updateBlock(blockId, data);
    if (!block) {
      return NextResponse.json(
        { success: false, message: "Block not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, block });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ blockId: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { blockId } = await context.params;
  const ok = await cmsService.deleteBlock(blockId);
  if (!ok) {
    return NextResponse.json(
      { success: false, message: "Block not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true });
}

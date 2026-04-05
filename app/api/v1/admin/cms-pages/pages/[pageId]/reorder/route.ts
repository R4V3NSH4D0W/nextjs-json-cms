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
    const body = (await request.json()) as { orderedBlockIds?: unknown };
    const ordered = body.orderedBlockIds;
    if (
      !Array.isArray(ordered) ||
      !ordered.every((id: unknown) => typeof id === "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "orderedBlockIds must be an array of string ids",
        },
        { status: 400 },
      );
    }
    const page = await cmsService.reorderBlocks(pageId, ordered);
    if (!page) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, page });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

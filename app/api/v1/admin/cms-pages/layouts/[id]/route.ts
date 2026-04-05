import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import { cmsService } from "@/lib/server/cms-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const layout = await cmsService.getLayoutById(id);
  if (!layout) {
    return NextResponse.json(
      { success: false, message: "Layout not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, layout });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    let refVal: string | null | undefined;
    if (body.referenceImageUrl !== undefined) {
      if (body.referenceImageUrl === null) refVal = null;
      else if (typeof body.referenceImageUrl === "string") {
        const s = body.referenceImageUrl.trim();
        refVal = s === "" ? null : s;
      } else {
        return NextResponse.json(
          { success: false, message: "referenceImageUrl must be a string or null" },
          { status: 400 },
        );
      }
    }
    const layout = await cmsService.updateLayout(id, {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.rootKey !== undefined ? { rootKey: String(body.rootKey) } : {}),
      ...(body.schema !== undefined ? { schema: body.schema } : {}),
      ...(body.referenceImageUrl !== undefined
        ? { referenceImageUrl: refVal! }
        : {}),
    });
    if (!layout) {
      return NextResponse.json(
        { success: false, message: "Layout not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, layout });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const ok = await cmsService.deleteLayout(id);
  if (!ok) {
    return NextResponse.json(
      { success: false, message: "Layout not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true });
}

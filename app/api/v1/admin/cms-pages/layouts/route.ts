import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import { cmsService } from "@/lib/server/cms-service";

export async function GET() {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const layouts = await cmsService.listLayouts();
  return NextResponse.json({ success: true, layouts });
}

export async function POST(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const rootKey = typeof body.rootKey === "string" ? body.rootKey.trim() : "";
    if (!name || !rootKey) {
      return NextResponse.json(
        { success: false, message: "name and rootKey are required" },
        { status: 400 },
      );
    }
    if (body.schema === undefined) {
      return NextResponse.json(
        { success: false, message: "schema is required" },
        { status: 400 },
      );
    }
    let ref: string | null | undefined;
    if (body.referenceImageUrl === undefined) ref = undefined;
    else if (body.referenceImageUrl === null) ref = null;
    else if (typeof body.referenceImageUrl === "string") {
      const s = body.referenceImageUrl.trim();
      ref = s === "" ? null : s;
    } else {
      return NextResponse.json(
        { success: false, message: "referenceImageUrl must be a string or null" },
        { status: 400 },
      );
    }
    const layout = await cmsService.createLayout({
      name,
      rootKey,
      schema: body.schema,
      referenceImageUrl: ref,
    });
    return NextResponse.json({ success: true, layout }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

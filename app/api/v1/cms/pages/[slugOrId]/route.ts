import { NextResponse } from "next/server";

import { validatePublicBlocksInDev } from "@/lib/cms/public-dev-validate";
import { cmsService } from "@/lib/server/cms-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slugOrId: string }> },
) {
  const { slugOrId } = await context.params;
  const decoded = decodeURIComponent(slugOrId ?? "").trim();
  if (!decoded) {
    return NextResponse.json(
      { success: false, message: "Invalid path" },
      { status: 400 },
    );
  }
  const page = await cmsService.getPublicPageBySlugOrId(decoded);
  if (!page) {
    return NextResponse.json(
      { success: false, message: "Page not found" },
      { status: 404 },
    );
  }
  validatePublicBlocksInDev(page.blocks);
  return NextResponse.json({ success: true, page });
}

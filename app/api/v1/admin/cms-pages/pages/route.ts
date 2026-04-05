import { NextResponse } from "next/server";

import { parseCmsPageSeoFromBody } from "@/lib/server/cms-page-seo-parse";
import { requireCmsSession } from "@/lib/server/cms-auth";
import { cmsService } from "@/lib/server/cms-service";

export async function GET() {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const pages = await cmsService.listPages();
  return NextResponse.json({ success: true, pages });
}

export async function POST(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json(
        { success: false, message: "title is required" },
        { status: 400 },
      );
    }
    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug.trim()
        : undefined;
    const published =
      typeof body.published === "boolean"
        ? body.published
        : typeof body.isActive === "boolean"
          ? body.isActive
          : true;
    const layoutId =
      body.layoutId === null
        ? null
        : typeof body.layoutId === "string"
          ? body.layoutId
          : undefined;
    const seo = parseCmsPageSeoFromBody(body);
    const page = await cmsService.createPage({
      title,
      slug,
      published,
      layoutId,
      ...seo,
    });
    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    if (msg.includes("Unique constraint") || msg.includes("slug")) {
      return NextResponse.json({ success: false, message: msg }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

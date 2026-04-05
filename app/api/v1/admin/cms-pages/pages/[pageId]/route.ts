import { NextResponse } from "next/server";

import type { Prisma } from "@/lib/generated/prisma/client";
import { parseCmsPageDraftData } from "@/lib/cms/cms-page-draft-data";
import { parseCmsPageSeoFromBody } from "@/lib/server/cms-page-seo-parse";
import { requireCmsSession } from "@/lib/server/cms-auth";
import { cmsService } from "@/lib/server/cms-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { pageId } = await context.params;
  const page = await cmsService.getPageById(pageId);
  if (!page) {
    return NextResponse.json(
      { success: false, message: "Page not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, page });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { pageId } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data: Parameters<typeof cmsService.updatePage>[1] = {};
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { success: false, message: "title must be a non-empty string" },
          { status: 400 },
        );
      }
      data.title = body.title.trim();
    }
    if (body.slug !== undefined) {
      if (typeof body.slug !== "string" || !body.slug.trim()) {
        return NextResponse.json(
          { success: false, message: "slug must be a non-empty string" },
          { status: 400 },
        );
      }
      data.slug = body.slug.trim();
    }
    const hasPublishedKey = Object.prototype.hasOwnProperty.call(
      body,
      "published",
    );
    if (hasPublishedKey) {
      if (typeof body.published !== "boolean") {
        return NextResponse.json(
          { success: false, message: "published must be boolean" },
          { status: 400 },
        );
      }
      data.published = body.published;
    } else if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { success: false, message: "isActive must be boolean" },
          { status: 400 },
        );
      }
      data.published = body.isActive;
    }
    if (
      body.isActive !== undefined &&
      typeof body.isActive === "boolean" &&
      hasPublishedKey
    ) {
      data.isActive = body.isActive;
    }
    if (body.layoutId !== undefined) {
      data.layoutId = body.layoutId === null ? null : String(body.layoutId);
    }
    if (Object.prototype.hasOwnProperty.call(body, "draftData")) {
      if (body.draftData === null) {
        data.draftData = null;
      } else if (
        body.draftData !== undefined &&
        typeof body.draftData === "object" &&
        body.draftData !== null
      ) {
        const parsed = parseCmsPageDraftData(body.draftData);
        if (!parsed) {
          return NextResponse.json(
            { success: false, message: "Invalid draftData payload" },
            { status: 400 },
          );
        }
        data.draftData = parsed as unknown as Prisma.InputJsonValue;
      } else {
        return NextResponse.json(
          { success: false, message: "draftData must be an object or null" },
          { status: 400 },
        );
      }
    }
    const seo = parseCmsPageSeoFromBody(body);
    Object.assign(data, seo);

    const page = await cmsService.updatePage(pageId, data);
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ pageId: string }> },
) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;
  const { pageId } = await context.params;
  const ok = await cmsService.deletePage(pageId);
  if (!ok) {
    return NextResponse.json(
      { success: false, message: "Page not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true });
}

import { unlink } from "node:fs/promises";

import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import { diskPathFromGalleryPublicUrl } from "@/lib/server/media-gallery";

export async function DELETE(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const rawUrl = url.searchParams.get("url") ?? "";
  if (!rawUrl.trim()) {
    return NextResponse.json(
      { success: false, message: "url is required" },
      { status: 400 },
    );
  }

  const diskPath = diskPathFromGalleryPublicUrl(rawUrl);
  if (!diskPath) {
    return NextResponse.json(
      { success: false, message: "Invalid gallery file URL" },
      { status: 400 },
    );
  }

  try {
    await unlink(diskPath);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not delete file";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

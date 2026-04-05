import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import {
  galleryBaseDir,
  galleryPublicUrl,
  isPathInsideGallery,
  normalizeFolderParam,
  safeSegment,
} from "@/lib/server/media-gallery";

export async function POST(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const rel = normalizeFolderParam(url.searchParams.get("folder"));
  const base = galleryBaseDir();
  const targetDir = rel ? path.join(base, ...rel.split("/").filter(Boolean)) : base;

  if (!isPathInsideGallery(targetDir, base)) {
    return NextResponse.json(
      { success: false, message: "Invalid folder path" },
      { status: 400 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { success: false, message: "Missing file" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const origName = safeSegment(file.name || "image");
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filename = `${id}-${origName}`;
  const diskPath = path.join(targetDir, filename);

  await mkdir(path.dirname(diskPath), { recursive: true });
  await writeFile(diskPath, buf);

  const relFile = rel ? `${rel}/${filename}` : filename;
  const publicUrl = galleryPublicUrl(relFile);

  return NextResponse.json({
    success: true,
    url: publicUrl,
    data: { url: publicUrl },
    file: { url: publicUrl },
  });
}

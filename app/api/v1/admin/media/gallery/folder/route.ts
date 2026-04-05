import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import {
  galleryBaseDir,
  isPathInsideGallery,
  normalizeFolderParam,
  safeSegment,
} from "@/lib/server/media-gallery";

export async function POST(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;

  let body: { name?: string; parent?: string };
  try {
    body = (await request.json()) as { name?: string; parent?: string };
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 },
    );
  }

  const rawName = String(body.name ?? "").trim();
  if (!rawName) {
    return NextResponse.json(
      { success: false, message: "Folder name is required" },
      { status: 400 },
    );
  }

  const name = safeSegment(rawName);
  const parentRel = normalizeFolderParam(
    body.parent == null ? null : String(body.parent),
  );

  const base = galleryBaseDir();
  const target = parentRel
    ? path.join(base, ...parentRel.split("/").filter(Boolean), name)
    : path.join(base, name);

  if (!isPathInsideGallery(target, base)) {
    return NextResponse.json(
      { success: false, message: "Invalid path" },
      { status: 400 },
    );
  }

  try {
    await mkdir(target, { recursive: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create folder";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }

  const newRel = parentRel ? `${parentRel}/${name}` : name;
  return NextResponse.json({ success: true, path: newRel });
}

export async function DELETE(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const folderRaw = url.searchParams.get("folder") ?? "";
  const rel = normalizeFolderParam(folderRaw);
  if (!rel) {
    return NextResponse.json(
      { success: false, message: "Cannot delete root folder" },
      { status: 400 },
    );
  }

  const base = galleryBaseDir();
  const target = path.join(base, ...rel.split("/").filter(Boolean));

  if (!isPathInsideGallery(target, base) || path.resolve(target) === path.resolve(base)) {
    return NextResponse.json(
      { success: false, message: "Invalid folder path" },
      { status: 400 },
    );
  }

  try {
    await rm(target, { recursive: true, force: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not delete folder";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

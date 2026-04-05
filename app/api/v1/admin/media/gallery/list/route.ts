import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireCmsSession } from "@/lib/server/cms-auth";
import {
  galleryBaseDir,
  galleryPublicUrl,
  isPathInsideGallery,
  normalizeFolderParam,
} from "@/lib/server/media-gallery";

const IMAGE_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
]);

export async function GET(request: Request) {
  const auth = await requireCmsSession();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const rel = normalizeFolderParam(url.searchParams.get("folder"));
  const base = galleryBaseDir();
  const target = rel ? path.join(base, ...rel.split("/").filter(Boolean)) : base;

  if (!isPathInsideGallery(target, base)) {
    return NextResponse.json(
      { success: false, message: "Invalid path" },
      { status: 400 },
    );
  }

  let entries: Dirent[];
  try {
    entries = await readdir(target, { withFileTypes: true });
  } catch {
    return NextResponse.json({
      success: true,
      folders: [] as string[],
      files: [] as { id: string; name: string; url: string }[],
    });
  }

  const folders: string[] = [];
  const files: { id: string; name: string; url: string }[] = [];

  for (const ent of entries) {
    if (ent.isDirectory()) {
      folders.push(ent.name);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      const relFile = rel ? `${rel}/${ent.name}` : ent.name;
      files.push({
        id: `${rel}/${ent.name}`,
        name: ent.name,
        url: galleryPublicUrl(relFile),
      });
    }
  }

  folders.sort();
  files.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ success: true, folders, files });
}

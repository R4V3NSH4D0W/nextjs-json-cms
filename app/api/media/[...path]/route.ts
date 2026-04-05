import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  galleryBaseDir,
  isPathInsideGallery,
} from "@/lib/server/media-gallery";

const MIME: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path: segments } = await context.params;
  const parts = Array.isArray(segments)
    ? segments.map((s) => {
        try {
          return decodeURIComponent(s);
        } catch {
          return "";
        }
      }).filter(Boolean)
    : [];

  if (parts.length === 0 || parts.some((p) => p === "..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const base = galleryBaseDir();
  const full = path.join(base, ...parts);
  if (!isPathInsideGallery(full, base)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buf = await readFile(full);
    const ext = path.extname(full).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

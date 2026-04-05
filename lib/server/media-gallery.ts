import path from "node:path";

const ASSETS = "assets";
const UPLOADS = "uploads";

/** Public URL prefix for files under {@link galleryBaseDir}. */
export const MEDIA_API_PREFIX = "/api/media";

/** On-disk root: `<cwd>/assets/uploads` (runtime uploads, not baked into the build). */
export function galleryBaseDir(cwd = process.cwd()): string {
  return path.join(cwd, ASSETS, UPLOADS);
}

/** Public URL for a path relative to `assets/uploads` (e.g. `cms/foo.png`). */
export function galleryPublicUrl(rel: string): string {
  const r = rel.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!r) return MEDIA_API_PREFIX;
  const parts = r
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg));
  return `${MEDIA_API_PREFIX}/${parts.join("/")}`;
}

export function safeSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64) || "untitled";
}

/** Relative path under `assets/uploads` (no leading slash). */
export function normalizeFolderParam(raw: string | null): string {
  if (!raw || raw === "/") return "";
  const s = raw.replace(/^\/+/, "").replace(/\\/g, "/");
  return s
    .split("/")
    .filter(Boolean)
    .map(safeSegment)
    .filter(Boolean)
    .join("/");
}

export function isPathInsideGallery(
  resolvedTarget: string,
  base = galleryBaseDir(),
): boolean {
  const resolvedBase = path.resolve(base);
  const resolved = path.resolve(resolvedTarget);
  return resolved === resolvedBase || resolved.startsWith(resolvedBase + path.sep);
}

/**
 * Map a stored public URL to an absolute disk path under `assets/uploads`.
 * Supports `/api/media/...` and legacy `/cms-uploads/...`.
 */
export function diskPathFromGalleryPublicUrl(publicUrl: string): string | null {
  const p = publicUrl.trim().split("?")[0] ?? "";
  let pathname = p;
  if (p.startsWith("http://") || p.startsWith("https://")) {
    try {
      pathname = new URL(p).pathname;
    } catch {
      return null;
    }
  }

  let rel = "";
  if (pathname.startsWith(`${MEDIA_API_PREFIX}/`)) {
    rel = pathname.slice(`${MEDIA_API_PREFIX}/`.length);
  } else if (pathname.startsWith("/cms-uploads/")) {
    rel = pathname.slice("/cms-uploads/".length);
  } else {
    return null;
  }

  const segments = rel
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return null;
      }
    })
    .filter((s): s is string => s !== null);

  if (segments.some((s) => s === "..")) return null;

  const base = galleryBaseDir();
  const full =
    segments.length > 0 ? path.join(base, ...segments) : base;
  if (!isPathInsideGallery(full, base)) return null;
  return full;
}

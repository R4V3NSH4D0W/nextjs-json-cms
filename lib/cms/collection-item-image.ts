const IMAGE_KEY_PATTERN =
  /(^|[_\-\s])(image|img|thumbnail|thumb|photo|picture|avatar|logo|cover|media)([_\-\s]|$)/i;
const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;

export interface CmsCollectionItemPreviewImage {
  url: string;
  fieldPath: string;
}

function humanizeFilenameSegment(segment: string): string {
  const words = segment
    .replace(/\.[^.]+$/, "")
    .replace(/^\d{10,}-[a-z0-9]{4,}-/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return words.replace(/\b\w/g, (char) => char.toUpperCase());
}

function isDisplayableImageUrl(value: string, fieldPath: string): boolean {
  const url = value.trim();
  if (!url) return false;
  const hasUsableProtocol =
    url.startsWith("/") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:image/");
  if (!hasUsableProtocol) return false;
  return IMAGE_KEY_PATTERN.test(fieldPath) || IMAGE_EXTENSION_PATTERN.test(url);
}

function imageCandidateScore(url: string, fieldPath: string): number {
  let score = 0;
  if (IMAGE_KEY_PATTERN.test(fieldPath)) score += 4;
  if (IMAGE_EXTENSION_PATTERN.test(url)) score += 2;
  if (fieldPath.split(".").length <= 2) score += 1;
  return score;
}

export function findCollectionItemPreviewImage(
  payload: Record<string, unknown>,
): CmsCollectionItemPreviewImage | null {
  const candidates: Array<CmsCollectionItemPreviewImage & { score: number }> = [];

  function visit(value: unknown, path: string): void {
    if (typeof value === "string") {
      const url = value.trim();
      if (isDisplayableImageUrl(url, path)) {
        candidates.push({
          url,
          fieldPath: path,
          score: imageCandidateScore(url, path),
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, `${path}.${index}`));
      return;
    }

    if (!value || typeof value !== "object") return;

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      visit(child, path ? `${path}.${key}` : key);
    }
  }

  visit(payload, "");

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.fieldPath.length - b.fieldPath.length;
  });

  const best = candidates[0];
  return best ? { url: best.url, fieldPath: best.fieldPath } : null;
}

export function titleFromImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const pathWithoutQuery = trimmed.split(/[?#]/)[0] ?? "";
  const filename = pathWithoutQuery.split("/").filter(Boolean).pop();
  if (!filename) return null;

  try {
    const title = humanizeFilenameSegment(decodeURIComponent(filename));
    return title || null;
  } catch {
    const title = humanizeFilenameSegment(filename);
    return title || null;
  }
}

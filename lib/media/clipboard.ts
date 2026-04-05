/** Clipboard image helpers for media library & CMS upload surfaces. */

export function mimeToExt(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/avif") return "avif";
  return "png";
}

export function imageFileFromClipboard(
  data: ClipboardEvent["clipboardData"],
): File | null {
  if (!data?.items?.length) return null;
  for (const item of data.items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

/** Skip hijacking paste when the user is typing in a field (let normal paste run). */
export function isPasteTargetEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable=true]"),
  );
}

/** Give pasted screenshots a stable filename for upload APIs. */
export function normalizeClipboardImageFile(file: File): File {
  const generic =
    !file.name ||
    file.name === "image.png" ||
    file.name === "image.jpeg" ||
    file.name === "pasted_image.png";
  if (!generic) return file;
  return new File(
    [file],
    `clipboard-${Date.now()}.${mimeToExt(file.type)}`,
    { type: file.type },
  );
}

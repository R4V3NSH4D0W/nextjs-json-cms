const PAGE_PREVIEW_PREF_PREFIX = "cms:page-preview-visible:";

function keyFor(scope: string): string {
  return `${PAGE_PREVIEW_PREF_PREFIX}${scope}`;
}

export function readPagePreviewVisiblePref(scope: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(keyFor(scope));
    if (raw === "hidden") return false;
    if (raw === "visible") return true;
    return true;
  } catch {
    return true;
  }
}

export function writePagePreviewVisiblePref(
  scope: string,
  visible: boolean,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(scope), visible ? "visible" : "hidden");
  } catch {
    // Ignore storage write failures.
  }
}

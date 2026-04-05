import type { CmsLayoutListItem } from "@/lib/cms/api";
import type { CmsNewPageLayoutSlot } from "@/lib/cms/new-page-draft";

/**
 * Resolves the preview image URL for site chrome: uses the direct reference
 * screenshot when set, otherwise the first layout section’s layout reference image.
 */
export function resolveSiteChromeReferenceImageUrl(
  directUrl: string | null | undefined,
  sections: CmsNewPageLayoutSlot[] | undefined,
  layouts: CmsLayoutListItem[]
): string | undefined {
  const t = typeof directUrl === "string" ? directUrl.trim() : "";
  if (t) return t;
  const byId = new Map(layouts.map((l) => [l.id, l]));
  const first = sections?.[0];
  const lid = first?.layoutId;
  if (!lid) return undefined;
  const ref = byId.get(lid)?.referenceImageUrl?.trim();
  return ref || undefined;
}

/**
 * When there is no resolved preview URL but a layout is chosen, return its name for a dashed placeholder.
 */
export function siteChromeSectionPlaceholderLabel(
  directUrl: string | null | undefined,
  sections: CmsNewPageLayoutSlot[] | undefined,
  layouts: CmsLayoutListItem[]
): string | undefined {
  if (resolveSiteChromeReferenceImageUrl(directUrl, sections, layouts)) {
    return undefined;
  }
  const lid = sections?.[0]?.layoutId;
  if (!lid) return undefined;
  return layouts.find((l) => l.id === lid)?.name;
}

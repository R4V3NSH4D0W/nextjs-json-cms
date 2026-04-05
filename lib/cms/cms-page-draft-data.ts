import type { CmsPageSeoFormValues } from "@/lib/cms/page-seo";
import type { CmsNewPageLayoutSlot } from "@/lib/cms/new-page-draft";

export const CMS_PAGE_DRAFT_VERSION = 1 as const;

export type CmsPageDraftDataV1 = {
  v: typeof CMS_PAGE_DRAFT_VERSION;
  title: string;
  slug: string;
  slots: CmsNewPageLayoutSlot[];
  seo: CmsPageSeoFormValues;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

/** Parse admin-stored draft JSON. Returns null if missing or invalid. */
export function parseCmsPageDraftData(
  raw: unknown
): CmsPageDraftDataV1 | null {
  if (raw === null || raw === undefined) return null;
  if (!isRecord(raw)) return null;
  if (raw.v !== CMS_PAGE_DRAFT_VERSION) return null;
  if (typeof raw.title !== "string" || typeof raw.slug !== "string")
    return null;
  if (!Array.isArray(raw.slots)) return null;
  if (!isRecord(raw.seo)) return null;
  return {
    v: CMS_PAGE_DRAFT_VERSION,
    title: raw.title,
    slug: raw.slug,
    slots: raw.slots as CmsNewPageLayoutSlot[],
    seo: raw.seo as unknown as CmsPageSeoFormValues,
  };
}

export function serializeCmsPageDraftData(input: {
  title: string;
  slug: string;
  slots: CmsNewPageLayoutSlot[];
  seo: CmsPageSeoFormValues;
}): CmsPageDraftDataV1 {
  return {
    v: CMS_PAGE_DRAFT_VERSION,
    title: input.title,
    slug: input.slug,
    slots: input.slots,
    seo: input.seo,
  };
}

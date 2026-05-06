import type { CmsPageSeoFormValues } from "@/lib/cms/page-seo";
import type { CmsNewPageLayoutSlot } from "@/lib/cms/new-page-draft";

export const CMS_PAGE_DRAFT_VERSION = 1 as const;
const CMS_PAGE_EDIT_TRANSIENT_VERSION = 1 as const;
const cmsPageEditTransientStorageKey = (pageId: string) =>
  `ecommerce-dashboard:cms-page-edit-transient-v1:${pageId}`;

export type CmsPageDraftDataV1 = {
  v: typeof CMS_PAGE_DRAFT_VERSION;
  title: string;
  slug: string;
  slots: CmsNewPageLayoutSlot[];
  seo: CmsPageSeoFormValues;
};

export type CmsPageEditTransientDraftV1 = {
  v: typeof CMS_PAGE_EDIT_TRANSIENT_VERSION;
  pageId: string;
  baseUpdatedAt: string;
  title: string;
  slug: string;
  published: boolean;
  slots: CmsNewPageLayoutSlot[];
  seo: CmsPageSeoFormValues;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function normalizeDraftSlots(rawSlots: unknown[]): CmsNewPageLayoutSlot[] {
  const seenIds = new Set<string>();
  const out: CmsNewPageLayoutSlot[] = [];

  for (const raw of rawSlots) {
    if (!isRecord(raw)) continue;

    const rawId = typeof raw.id === "string" ? raw.id.trim() : "";
    const id =
      rawId && !seenIds.has(rawId) ? rawId : crypto.randomUUID();
    seenIds.add(id);

    const layoutId =
      typeof raw.layoutId === "string" && raw.layoutId.trim().length > 0
        ? raw.layoutId
        : null;

    const blockId =
      typeof raw.blockId === "string" && raw.blockId.trim().length > 0
        ? raw.blockId
        : undefined;

    const configValues = isRecord(raw.configValues) ? raw.configValues : {};
    const appliedLayoutId =
      typeof raw.appliedLayoutId === "string" && raw.appliedLayoutId.trim().length > 0
        ? raw.appliedLayoutId
        : layoutId && Object.keys(configValues).length > 0
          ? layoutId
          : null;

    out.push({
      id,
      blockId,
      layoutId,
      configValues,
      appliedLayoutId,
      isActive: raw.isActive !== false,
    });
  }

  return out;
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
  const normalizedSlots = normalizeDraftSlots(raw.slots);
  return {
    v: CMS_PAGE_DRAFT_VERSION,
    title: raw.title,
    slug: raw.slug,
    slots: normalizedSlots,
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

export function saveCmsPageEditTransientDraft(input: {
  pageId: string;
  baseUpdatedAt: string;
  title: string;
  slug: string;
  published: boolean;
  slots: CmsNewPageLayoutSlot[];
  seo: CmsPageSeoFormValues;
}): void {
  if (typeof window === "undefined") return;
  if (!input.pageId) return;
  try {
    const payload: CmsPageEditTransientDraftV1 = {
      v: CMS_PAGE_EDIT_TRANSIENT_VERSION,
      pageId: input.pageId,
      baseUpdatedAt: input.baseUpdatedAt,
      title: input.title,
      slug: input.slug,
      published: input.published,
      slots: input.slots,
      seo: input.seo,
    };
    sessionStorage.setItem(
      cmsPageEditTransientStorageKey(input.pageId),
      JSON.stringify(payload)
    );
  } catch {
    // ignore quota / private mode errors
  }
}

export function loadCmsPageEditTransientDraft(
  pageId: string
): CmsPageEditTransientDraftV1 | null {
  if (typeof window === "undefined") return null;
  if (!pageId) return null;
  try {
    const raw = sessionStorage.getItem(cmsPageEditTransientStorageKey(pageId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      parsed.v !== CMS_PAGE_EDIT_TRANSIENT_VERSION ||
      parsed.pageId !== pageId ||
      typeof parsed.baseUpdatedAt !== "string" ||
      typeof parsed.title !== "string" ||
      typeof parsed.slug !== "string" ||
      typeof parsed.published !== "boolean" ||
      !Array.isArray(parsed.slots) ||
      !isRecord(parsed.seo)
    ) {
      return null;
    }
    return {
      v: CMS_PAGE_EDIT_TRANSIENT_VERSION,
      pageId,
      baseUpdatedAt: parsed.baseUpdatedAt,
      title: parsed.title,
      slug: parsed.slug,
      published: parsed.published,
      slots: normalizeDraftSlots(parsed.slots),
      seo: parsed.seo as unknown as CmsPageSeoFormValues,
    };
  } catch {
    return null;
  }
}

export function clearCmsPageEditTransientDraft(pageId: string): void {
  if (typeof window === "undefined") return;
  if (!pageId) return;
  try {
    sessionStorage.removeItem(cmsPageEditTransientStorageKey(pageId));
  } catch {
    // ignore
  }
}

import {
  normalizeCmsPageSeoDraft,
  type CmsPageSeoFormValues,
} from "@/lib/cms/page-seo";

const STORAGE_KEY = "ecommerce-dashboard:cms-new-page-draft-v1";

export interface CmsNewPageLayoutSlot {
  id: string;
  /** Set when editing an existing `text_block` from the API. */
  blockId?: string;
  layoutId: string | null;
  configValues: Record<string, unknown>;
  /**
   * When equal to `layoutId`, `configValues` is treated as initialized for that layout
   * (skip auto-template overwrite on load).
   */
  appliedLayoutId?: string | null;
  /**
   * Maps to `text_block.isActive` — inactive blocks are omitted from public CMS API.
   * Default: active (`true`).
   */
  isActive?: boolean;
}

export interface CmsNewPageDraft {
  v: 1;
  title: string;
  slug: string;
  slots: CmsNewPageLayoutSlot[];
  seo: CmsPageSeoFormValues;
}

/** Stable id for the first section — avoids SSR/client hydration mismatch. */
export const CMS_NEW_PAGE_INITIAL_SLOT_ID = "cms-new-page-slot-1";

export function createDefaultSlot(): CmsNewPageLayoutSlot {
  return {
    id: CMS_NEW_PAGE_INITIAL_SLOT_ID,
    blockId: undefined,
    layoutId: null,
    configValues: {},
    appliedLayoutId: null,
    isActive: true,
  };
}

export function createEmptySlot(): CmsNewPageLayoutSlot {
  return {
    id: crypto.randomUUID(),
    blockId: undefined,
    layoutId: null,
    configValues: {},
    appliedLayoutId: null,
    isActive: true,
  };
}

/**
 * If multiple slots reference the same CMS `blockId` (invalid), keep the first and
 * clear the rest so each section syncs to its own `text_block`. Avoids backend
 * `reorderBlocks` rejecting duplicate ids.
 */
export function dedupeSlotBlockIds(slots: CmsNewPageLayoutSlot[]): CmsNewPageLayoutSlot[] {
  const seen = new Set<string>();
  return slots.map((s) => {
    if (!s.blockId) return s;
    if (seen.has(s.blockId)) {
      return { ...s, blockId: undefined };
    }
    seen.add(s.blockId);
    return s;
  });
}

/**
 * When returning from the layouts list with `addLayoutId`:
 * - If `maxSections <= 1` and a section already exists, **replace** that section’s layout (navbar/footer).
 * - If there is exactly **one** section and it has **no** layout yet (blank starter row), **fill** that row — first pick on a new page.
 * - Otherwise **always append** a new section at the **end** with the chosen layout. This lets the same layout (e.g. `hero_banner`) appear again at the 5th position instead of filling an earlier empty slot.
 */
export function slotsWithAddedLayout(
  prev: CmsNewPageLayoutSlot[],
  addLayoutId: string,
  maxSections?: number
): CmsNewPageLayoutSlot[] {
  const max = maxSections ?? Infinity;
  if (max <= 1 && prev.length >= 1) {
    return prev.slice(0, 1).map((s, i) =>
      i === 0
        ? {
            ...s,
            layoutId: addLayoutId,
            configValues: {},
            appliedLayoutId: null,
          }
        : s
    );
  }

  const singleBlankStarter =
    prev.length === 1 && !prev[0]?.layoutId;

  if (singleBlankStarter) {
    return prev.map((s, i) =>
      i === 0
        ? {
            ...s,
            layoutId: addLayoutId,
            configValues: {},
            appliedLayoutId: null,
          }
        : s
    );
  }

  if (prev.length >= max) {
    return prev;
  }
  const next = createEmptySlot();
  return [
    ...prev,
    {
      ...next,
      layoutId: addLayoutId,
      configValues: {},
      appliedLayoutId: null,
      isActive: true,
    },
  ];
}

function normalizeSlot(raw: CmsNewPageLayoutSlot): CmsNewPageLayoutSlot {
  const layoutId = raw.layoutId ?? null;
  const configValues =
    raw.configValues && typeof raw.configValues === "object" && !Array.isArray(raw.configValues)
      ? raw.configValues
      : {};
  const appliedLayoutId =
    raw.appliedLayoutId ??
    (layoutId && Object.keys(configValues).length > 0 ? layoutId : null);
  return {
    id: raw.id || crypto.randomUUID(),
    blockId: raw.blockId,
    layoutId,
    configValues,
    appliedLayoutId,
    isActive: raw.isActive !== false,
  };
}

export function loadCmsNewPageDraft(): CmsNewPageDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CmsNewPageDraft;
    if (parsed.v !== 1 || !Array.isArray(parsed.slots)) return null;
    return {
      v: 1,
      title: typeof parsed.title === "string" ? parsed.title : "",
      slug: typeof parsed.slug === "string" ? parsed.slug : "",
      slots: parsed.slots.map(normalizeSlot),
      seo: normalizeCmsPageSeoDraft(
        (parsed as { seo?: unknown }).seo
      ),
    };
  } catch {
    return null;
  }
}

export function saveCmsNewPageDraft(draft: CmsNewPageDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // quota / private mode
  }
}

export function clearCmsNewPageDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

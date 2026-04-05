import {
  createEmptySlot,
  type CmsNewPageLayoutSlot,
} from "./new-page-draft";

/**
 * Normalizes one persisted site-chrome layout section (navbar / footer / announcements).
 * Omits `blockId` unless explicitly present (site chrome does not sync to page blocks).
 */
export function normalizeSiteLayoutSlot(raw: unknown): CmsNewPageLayoutSlot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return createEmptySlot();
  }
  const o = raw as Record<string, unknown>;
  const layoutId =
    typeof o.layoutId === "string" && o.layoutId.trim()
      ? o.layoutId
      : null;
  const configValues =
    o.configValues && typeof o.configValues === "object" && !Array.isArray(o.configValues)
      ? (o.configValues as Record<string, unknown>)
      : {};
  const appliedLayoutId =
    o.appliedLayoutId === null || typeof o.appliedLayoutId === "string"
      ? (o.appliedLayoutId as string | null)
      : layoutId && Object.keys(configValues).length > 0
        ? layoutId
        : null;
  const base = createEmptySlot();
  return {
    id: typeof o.id === "string" && o.id.trim() ? o.id : base.id,
    blockId:
      typeof o.blockId === "string" && o.blockId.trim() ? o.blockId : undefined,
    layoutId,
    configValues,
    appliedLayoutId,
    isActive: o.isActive === false ? false : true,
  };
}

export function normalizeSiteLayoutSections(raw: unknown): CmsNewPageLayoutSlot[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSiteLayoutSlot);
}

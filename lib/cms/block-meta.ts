/** Stored on each `text_block` config so edit mode can restore the layout picker. */
export const CMS_BLOCK_LAYOUT_META_KEY = "__cmsLayoutId";

export function stripLayoutMetaFromConfig(
  config: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...config };
  delete next[CMS_BLOCK_LAYOUT_META_KEY];
  return next;
}

export function mergeLayoutMetaIntoConfig(
  config: Record<string, unknown>,
  layoutId: string | null
): Record<string, unknown> {
  if (!layoutId) {
    const next = { ...config };
    delete next[CMS_BLOCK_LAYOUT_META_KEY];
    return next;
  }
  return { ...config, [CMS_BLOCK_LAYOUT_META_KEY]: layoutId };
}

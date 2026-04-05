/**
 * Canonical CMS block `type` strings (admin + server). Labels are UI-only.
 */
export const CMS_BLOCK_TYPES = [
  "hero",
  "categories",
  "brands",
  "featured_products",
  "recommended",
  "editorial",
  "banner",
  "text_block",
] as const;

export type CmsBlockType = (typeof CMS_BLOCK_TYPES)[number];

export const CMS_BLOCK_TYPE_LABELS: Record<CmsBlockType, string> = {
  hero: "Hero Banner",
  categories: "Categories Grid",
  brands: "Brands Carousel",
  featured_products: "Featured Products",
  recommended: "Recommended Products",
  editorial: "Editorial Section",
  banner: "Promotional Banner",
  text_block: "Text Block",
};

/** Admin UI: type + label for pickers (same order as `CMS_BLOCK_TYPES`). */
export const BLOCK_TYPES: ReadonlyArray<{ type: CmsBlockType; label: string }> =
  CMS_BLOCK_TYPES.map((type) => ({
    type,
    label: CMS_BLOCK_TYPE_LABELS[type],
  }));

import type { CmsLayout, CmsPage } from "@/lib/cms/api";
import {
  createDefaultSlot,
  type CmsNewPageLayoutSlot,
} from "@/lib/cms/new-page-draft";
import {
  CMS_BLOCK_LAYOUT_META_KEY,
  stripLayoutMetaFromConfig,
} from "@/lib/cms/block-meta";
import {
  parseLayoutSchema,
  validateRequiredLayoutValues,
} from "@/lib/cms/layout-payload";

/**
 * Maps `text_block` rows (layout sections) to editor slots. Other block types
 * are ignored here and preserved when syncing order.
 */
export function blocksToLayoutSlots(page: CmsPage): CmsNewPageLayoutSlot[] {
  const textBlocks = [...page.blocks]
    .filter((b) => b.type === "text_block" && b.isActive !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (textBlocks.length === 0) {
    return [createDefaultSlot()];
  }

  return textBlocks.map((b) => {
    const raw =
      b.config && typeof b.config === "object" && !Array.isArray(b.config)
        ? (b.config as Record<string, unknown>)
        : {};
    const layoutId =
      (raw[CMS_BLOCK_LAYOUT_META_KEY] as string | undefined) ?? null;
    const configValues = stripLayoutMetaFromConfig(raw);
    const appliedLayoutId =
      layoutId && Object.keys(configValues).length > 0 ? layoutId : null;

    return {
      id: b.id,
      blockId: b.id,
      layoutId,
      configValues,
      appliedLayoutId,
      isActive: b.isActive !== false,
    };
  });
}

/**
 * Returns an error message if the page cannot be saved, or null if valid.
 * Requires at least one section row and at least one section with a layout.
 */
export function validateCmsSlotsForSave(
  slots: CmsNewPageLayoutSlot[]
): string | null {
  if (slots.length === 0) {
    return "Add at least one section before saving.";
  }
  if (!slots.some((s) => s.layoutId)) {
    return "Add a layout to at least one section (use Add layout).";
  }
  return null;
}

/**
 * Runs `validateCmsSlotsForSave`, then checks each section’s config against
 * layout schema fields marked `required: true`.
 */
export async function validateCmsSlotsLayoutFields(
  slots: CmsNewPageLayoutSlot[],
  getLayout: (layoutId: string) => Promise<CmsLayout | null>
): Promise<string | null> {
  const base = validateCmsSlotsForSave(slots);
  if (base) return base;

  for (const slot of slots) {
    if (!slot.layoutId) continue;
    if (slot.isActive === false) continue;
    const layout = await getLayout(slot.layoutId);
    if (
      !layout?.schema ||
      typeof layout.schema !== "object" ||
      Array.isArray(layout.schema)
    ) {
      continue;
    }
    const { rootKey, defs } = parseLayoutSchema(
      layout.schema as Record<string, unknown>,
      layout.rootKey
    );
    const err = validateRequiredLayoutValues(
      rootKey,
      defs,
      slot.configValues
    );
    if (err) return err;
  }
  return null;
}

/**
 * Validates site-chrome layout sections (navbar / footer / announcements).
 * Empty sections are allowed. For each slot with a `layoutId`, required schema
 * fields are enforced (same rules as CMS page sections).
 */
export async function validateSiteLayoutSectionsOptional(
  slots: CmsNewPageLayoutSlot[],
  getLayout: (layoutId: string) => Promise<CmsLayout | null>
): Promise<string | null> {
  for (const slot of slots) {
    if (!slot.layoutId) continue;
    if (slot.isActive === false) continue;
    const layout = await getLayout(slot.layoutId);
    if (
      !layout?.schema ||
      typeof layout.schema !== "object" ||
      Array.isArray(layout.schema)
    ) {
      continue;
    }
    const { rootKey, defs } = parseLayoutSchema(
      layout.schema as Record<string, unknown>,
      layout.rootKey
    );
    const err = validateRequiredLayoutValues(
      rootKey,
      defs,
      slot.configValues
    );
    if (err) return err;
  }
  return null;
}

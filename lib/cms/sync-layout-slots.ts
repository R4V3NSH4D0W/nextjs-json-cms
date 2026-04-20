import { cmsApi, type CmsPage } from "@/lib/cms/api";
import { mergeLayoutMetaIntoConfig } from "@/lib/cms/block-meta";
import {
  dedupeSlotBlockIds,
  type CmsNewPageLayoutSlot,
} from "@/lib/cms/new-page-draft";

/**
 * Deletes removed text blocks, updates / creates layout sections, then reorders
 * all blocks so non–text_block blocks stay in place and text_blocks follow slot order.
 */
export async function syncLayoutSlotsToPage(params: {
  projectSlug: string;
  pageId: string;
  pageSnapshot: CmsPage;
  slots: CmsNewPageLayoutSlot[];
}): Promise<void> {
  const { projectSlug, pageId, pageSnapshot, slots: rawSlots } = params;
  const slots = dedupeSlotBlockIds(rawSlots);
  const layoutSlots = slots.filter((s) => s.layoutId);

  const startTextBlockIds = pageSnapshot.blocks
    .filter((b) => b.type === "text_block")
    .map((b) => b.id);

  const keepBlockIds = new Set(
    layoutSlots.map((s) => s.blockId).filter(Boolean) as string[]
  );

  for (const bid of startTextBlockIds) {
    if (!keepBlockIds.has(bid)) {
      await cmsApi.deleteBlock(projectSlug, bid);
    }
  }

  if (layoutSlots.length === 0) {
    return;
  }

  const slotIdToBlockId = new Map<string, string>();

  for (const slot of layoutSlots) {
    const config = mergeLayoutMetaIntoConfig(
      slot.configValues,
      slot.layoutId
    );
    const blockActive = slot.isActive !== false;
    if (slot.blockId) {
      await cmsApi.updateBlock(projectSlug, slot.blockId, {
        type: "text_block",
        config,
        isActive: blockActive,
      });
      slotIdToBlockId.set(slot.id, slot.blockId);
    } else {
      const res = await cmsApi.addBlock(projectSlug, pageId, {
        type: "text_block",
        config,
        isActive: blockActive,
      });
      slotIdToBlockId.set(slot.id, res.block.id);
    }
  }

  const fresh = await cmsApi.getPage(projectSlug, pageId);
  const sorted = [...fresh.page.blocks].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const textIdsInSlotOrder = layoutSlots.map((s) => slotIdToBlockId.get(s.id));
  if (textIdsInSlotOrder.some((id) => id == null || id === "")) {
    throw new Error(
      "CMS sync: missing block id for a layout section. Try refreshing the page."
    );
  }
  const textIds = textIdsInSlotOrder as string[];
  if (new Set(textIds).size !== textIds.length) {
    throw new Error(
      "CMS sync: duplicate block ids across sections (internal). Try refreshing the page."
    );
  }

  const finalOrder: string[] = [];
  let ti = 0;
  for (const b of sorted) {
    if (b.type === "text_block") {
      const nextId = textIds[ti++];
      if (nextId) finalOrder.push(nextId);
    } else {
      finalOrder.push(b.id);
    }
  }
  while (ti < textIds.length) {
    finalOrder.push(textIds[ti++]!);
  }

  if (finalOrder.length !== sorted.length) {
    throw new Error(
      `CMS sync: block count mismatch after save (${finalOrder.length} vs ${sorted.length}). Try again.`
    );
  }

  const sortedIds = sorted.map((b) => b.id);
  const orderSet = new Set(sortedIds);
  if (finalOrder.some((id) => !orderSet.has(id))) {
    throw new Error(
      "CMS sync: reorder references unknown block ids. Try refreshing the page."
    );
  }

  await cmsApi.reorderBlocks(projectSlug, pageId, finalOrder);
}

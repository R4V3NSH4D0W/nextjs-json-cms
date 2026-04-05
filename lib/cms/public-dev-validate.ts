import { PUBLIC_SECTION_CONTENT_SCHEMAS } from "@/lib/cms/generated/public-sections";
import type { GeneratedPublicSectionKey } from "@/lib/cms/generated/public-sections";

/**
 * In development, log when `content` does not match generated Zod for a known `sectionKey`.
 * No-op in production.
 */
export function validatePublicBlocksInDev(
  blocks: { sectionKey: string | null; content: unknown }[],
): void {
  if (process.env.NODE_ENV !== "development") return;

  for (const b of blocks) {
    if (b.sectionKey == null) continue;
    const key = b.sectionKey as GeneratedPublicSectionKey;
    const schema = PUBLIC_SECTION_CONTENT_SCHEMAS[key];
    if (!schema) continue;
    const r = schema.safeParse(b.content);
    if (!r.success) {
      console.warn(
        "[cms] public block content failed validation",
        b.sectionKey,
        r.error.flatten(),
      );
    }
  }
}

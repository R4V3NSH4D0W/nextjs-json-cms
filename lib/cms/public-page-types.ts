/**
 * Public storefront CMS API shapes (`GET /api/v1/cms/pages/...`).
 * Block `content` types are generated from layout schemas — see `pnpm cms:gen-types`.
 */
import type { GeneratedPublicBlock } from "@/lib/cms/generated/public-sections";
import type { PublicCmsPageSeo } from "@/lib/server/cms-public-page-seo";

export type { GeneratedPublicBlock } from "@/lib/cms/generated/public-sections";
export type { GeneratedPublicSectionKey } from "@/lib/cms/generated/public-sections";

/**
 * One row in `page.blocks` from the public API. This is the unit the storefront
 * renders (registry keys on `sectionKey`; fields live in `content`).
 *
 * ```json
 * {
 *   "id": "…",
 *   "displayOrder": 0,
 *   "sectionKey": "home",
 *   "content": { "title": "…", "description": "<p>…</p>" }
 * }
 * ```
 */
export type PublicCmsBlock = GeneratedPublicBlock;

/** Only the block list — enough for `<PublicBlocksList />` and SEO aside. */
export type PublicCmsPageBlocksOnly = {
  blocks: PublicCmsBlock[];
};

export type PublicCmsPage = PublicCmsPageBlocksOnly & {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
  seo: PublicCmsPageSeo;
};

/** Use when you only need blocks from a loaded page (e.g. pass to the block renderer). */
export function publicPageBlocks(page: Pick<PublicCmsPage, "blocks">): PublicCmsBlock[] {
  return page.blocks;
}

/** `GET /api/v1/cms/pages` list rows (no `blocks`). */
export type PublicCmsPageListItem = {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
  seo: PublicCmsPageSeo;
};

export type PublicPageResponse = { success: true; page: PublicCmsPage };
export type PublicPagesListResponse = { success: true; pages: PublicCmsPageListItem[] };

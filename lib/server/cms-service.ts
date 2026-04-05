import { Prisma } from "@/lib/generated/prisma/client";
import { CmsSiteContentKey } from "@/lib/generated/prisma/enums";
import { getPrisma } from "@/lib/server/prisma";
import { shapePublicBlock } from "@/lib/server/cms-public-block";
import { shapePublicCmsPageSeo } from "@/lib/server/cms-public-page-seo";

export const CMS_BLOCK_TYPES = [
  'hero',
  'categories',
  'brands',
  'featured_products',
  'recommended',
  'editorial',
  'banner',
  'text_block',
] as const;

export type CmsBlockType = (typeof CMS_BLOCK_TYPES)[number];

const blockTypeSet = new Set<string>(CMS_BLOCK_TYPES);

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'page';
}

async function nextUniqueSlug(base: string, excludePageId?: string): Promise<string> {
  let candidate = slugify(base);
  if (!candidate) candidate = 'page';
  let n = 0;
  for (;;) {
    const slug = n === 0 ? candidate : `${candidate}-${n}`;
    const existing = await getPrisma().cmsPage.findUnique({ where: { slug } });
    if (!existing || existing.id === excludePageId) return slug;
    n += 1;
  }
}

function assertBlockType(type: string): asserts type is CmsBlockType {
  if (!blockTypeSet.has(type)) {
    throw new Error(`Invalid block type "${type}". Allowed: ${CMS_BLOCK_TYPES.join(', ')}`);
  }
}

function parseConfig(config: unknown): Prisma.InputJsonValue {
  if (config === undefined || config === null) return {};
  if (typeof config === 'object' && !Array.isArray(config)) {
    return config as Prisma.InputJsonValue;
  }
  throw new Error('config must be a JSON object');
}

export const cmsService = {
  CMS_BLOCK_TYPES,

  async listPages() {
    const pages = await getPrisma().cmsPage.findMany({
      include: {
        blocks: { orderBy: { displayOrder: 'asc' } },
        layout: { select: { id: true, name: true, rootKey: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return pages;
  },

  async getPageById(id: string) {
    return getPrisma().cmsPage.findUnique({
      where: { id },
      include: {
        blocks: { orderBy: { displayOrder: 'asc' } },
        layout: true,
      },
    });
  },

  async createPage(
    data: {
      title: string;
      slug?: string;
      /** Live on public API. Legacy: `isActive` on create body mapped to this if omitted. */
      published?: boolean;
      /** @deprecated Prefer `published`. When `published` is omitted, this sets storefront visibility. */
      isActive?: boolean;
      layoutId?: null | string;
    } & Partial<{
      metaTitle: null | string;
      metaDescription: null | string;
      ogImage: null | string;
      ogTitle: null | string;
      ogDescription: null | string;
      canonicalUrl: null | string;
      noIndex: boolean;
    }>
  ) {
    if (data.layoutId) {
      const layout = await getPrisma().cmsLayout.findUnique({ where: { id: data.layoutId } });
      if (!layout) throw new Error('layoutId references an unknown layout');
    }
    const slug = data.slug ? await nextUniqueSlug(data.slug) : await nextUniqueSlug(data.title);
    const published =
      data.published !== undefined
        ? data.published
        : data.isActive !== undefined
          ? data.isActive
          : true;
    return getPrisma().cmsPage.create({
      data: {
        title: data.title,
        slug,
        isActive: true,
        published,
        layoutId: data.layoutId ?? undefined,
        ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle } : {}),
        ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription } : {}),
        ...(data.ogImage !== undefined ? { ogImage: data.ogImage } : {}),
        ...(data.ogTitle !== undefined ? { ogTitle: data.ogTitle } : {}),
        ...(data.ogDescription !== undefined ? { ogDescription: data.ogDescription } : {}),
        ...(data.canonicalUrl !== undefined ? { canonicalUrl: data.canonicalUrl } : {}),
        ...(data.noIndex !== undefined ? { noIndex: data.noIndex } : {}),
      },
      include: {
        blocks: { orderBy: { displayOrder: 'asc' } },
        layout: { select: { id: true, name: true, rootKey: true } },
      },
    });
  },

  async updatePage(
    id: string,
    data: Partial<{
      title: string;
      slug: string;
      /** Enabled in CMS (not archived). */
      isActive: boolean;
      /** Live on public `/api/v1/cms/pages/...`. */
      published: boolean;
      layoutId: null | string;
      metaTitle: null | string;
      metaDescription: null | string;
      ogImage: null | string;
      ogTitle: null | string;
      ogDescription: null | string;
      canonicalUrl: null | string;
      noIndex: boolean;
      /** Admin-only draft JSON; `null` clears. Public API ignores this. */
      draftData: Prisma.InputJsonValue | null;
    }>
  ) {
    const existing = await getPrisma().cmsPage.findUnique({ where: { id } });
    if (!existing) return null;

    if (data.layoutId) {
      const layout = await getPrisma().cmsLayout.findUnique({ where: { id: data.layoutId } });
      if (!layout) throw new Error('layoutId references an unknown layout');
    }

    let slug = existing.slug;
    if (data.slug !== undefined) {
      slug = await nextUniqueSlug(data.slug, id);
    }

    return getPrisma().cmsPage.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.slug !== undefined ? { slug } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.published !== undefined ? { published: data.published } : {}),
        ...(data.layoutId !== undefined ? { layoutId: data.layoutId } : {}),
        ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle } : {}),
        ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription } : {}),
        ...(data.ogImage !== undefined ? { ogImage: data.ogImage } : {}),
        ...(data.ogTitle !== undefined ? { ogTitle: data.ogTitle } : {}),
        ...(data.ogDescription !== undefined ? { ogDescription: data.ogDescription } : {}),
        ...(data.canonicalUrl !== undefined ? { canonicalUrl: data.canonicalUrl } : {}),
        ...(data.noIndex !== undefined ? { noIndex: data.noIndex } : {}),
        ...(data.draftData !== undefined
          ? {
              draftData:
                data.draftData === null ? Prisma.JsonNull : data.draftData,
            }
          : {}),
      },
      include: {
        blocks: { orderBy: { displayOrder: 'asc' } },
        layout: { select: { id: true, name: true, rootKey: true } },
      },
    });
  },

  async deletePage(id: string) {
    try {
      await getPrisma().cmsPage.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async createBlock(pageId: string, data: { type: string; config?: unknown; isActive?: boolean }) {
    assertBlockType(data.type);
    const page = await getPrisma().cmsPage.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        blocks: { select: { displayOrder: true }, orderBy: { displayOrder: 'desc' }, take: 1 },
      },
    });
    if (!page) return null;

    const maxOrder = page.blocks[0]?.displayOrder ?? -1;
    return getPrisma().cmsBlock.create({
      data: {
        pageId,
        type: data.type,
        displayOrder: maxOrder + 1,
        config: parseConfig(data.config),
        isActive: data.isActive ?? true,
      },
    });
  },

  async updateBlock(
    blockId: string,
    data: Partial<{
      type: string;
      config: unknown;
      displayOrder: number;
      isActive: boolean;
    }>
  ) {
    if (data.type !== undefined) assertBlockType(data.type);

    try {
      return await getPrisma().cmsBlock.update({
        where: { id: blockId },
        data: {
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.config !== undefined ? { config: parseConfig(data.config) } : {}),
          ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    } catch {
      return null;
    }
  },

  async deleteBlock(blockId: string) {
    try {
      await getPrisma().cmsBlock.delete({ where: { id: blockId } });
      return true;
    } catch {
      return false;
    }
  },

  async reorderBlocks(pageId: string, orderedBlockIds: string[]) {
    const blocks = await getPrisma().cmsBlock.findMany({
      where: { pageId },
      select: { id: true },
    });
    const idSet = new Set(blocks.map((b) => b.id));
    if (new Set(orderedBlockIds).size !== orderedBlockIds.length) {
      const seen = new Set<string>();
      const dupes = orderedBlockIds.filter((id) => {
        if (seen.has(id)) return true;
        seen.add(id);
        return false;
      });
      throw new Error(
        `orderedBlockIds must not contain duplicates (duplicate ids: ${[...new Set(dupes)].join(', ')}). Each CMS block id must appear once.`
      );
    }
    if (orderedBlockIds.length !== idSet.size) {
      throw new Error('orderedBlockIds must include every block on the page exactly once');
    }
    for (const id of orderedBlockIds) {
      if (!idSet.has(id)) {
        throw new Error('orderedBlockIds contains an unknown block id');
      }
    }

    await getPrisma().$transaction(
      orderedBlockIds.map((id, index) =>
        getPrisma().cmsBlock.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    return getPrisma().cmsPage.findUnique({
      where: { id: pageId },
      include: { blocks: { orderBy: { displayOrder: 'asc' } } },
    });
  },

  async listLayouts() {
    return getPrisma().cmsLayout.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        rootKey: true,
        referenceImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async getLayoutById(id: string) {
    return getPrisma().cmsLayout.findUnique({ where: { id } });
  },

  async createLayout(data: {
    name: string;
    rootKey: string;
    schema: unknown;
    referenceImageUrl?: null | string;
  }) {
    if (typeof data.schema !== 'object' || data.schema === null || Array.isArray(data.schema)) {
      throw new Error('schema must be a JSON object');
    }
    return getPrisma().cmsLayout.create({
      data: {
        name: data.name,
        rootKey: data.rootKey,
        schema: data.schema as Prisma.InputJsonValue,
        referenceImageUrl:
          data.referenceImageUrl === undefined
            ? undefined
            : data.referenceImageUrl === null || data.referenceImageUrl === ''
              ? null
              : data.referenceImageUrl,
      },
    });
  },

  async updateLayout(
    id: string,
    data: Partial<{
      name: string;
      rootKey: string;
      schema: unknown;
      referenceImageUrl: null | string;
    }>
  ) {
    const update: Prisma.CmsLayoutUpdateInput = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.rootKey !== undefined) update.rootKey = data.rootKey;
    if (data.schema !== undefined) {
      if (typeof data.schema !== 'object' || data.schema === null || Array.isArray(data.schema)) {
        throw new Error('schema must be a JSON object');
      }
      update.schema = data.schema as Prisma.InputJsonValue;
    }
    if (data.referenceImageUrl !== undefined) {
      update.referenceImageUrl =
        data.referenceImageUrl === null || data.referenceImageUrl === ''
          ? null
          : data.referenceImageUrl;
    }
    if (Object.keys(update).length === 0) {
      return getPrisma().cmsLayout.findUnique({ where: { id } });
    }
    try {
      return await getPrisma().cmsLayout.update({
        where: { id },
        data: update,
      });
    } catch {
      return null;
    }
  },

  async deleteLayout(id: string) {
    try {
      await getPrisma().cmsLayout.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  // --- Site chrome (navigation, footer, announcements) — JSON payloads per cms-backend-site-chrome.md

  async getNavigationConfig(): Promise<Prisma.JsonValue> {
    const row = await getPrisma().cmsSiteContent.findUnique({
      where: { key: CmsSiteContentKey.navigation },
    });
    if (!row) return { v: 1, items: [] } as Prisma.JsonValue;
    return row.payload;
  },

  async putNavigationConfig(payload: unknown): Promise<Prisma.JsonValue> {
    const validated = assertSiteNavigationPayload(payload);
    const row = await getPrisma().cmsSiteContent.upsert({
      where: { key: CmsSiteContentKey.navigation },
      create: {
        key: CmsSiteContentKey.navigation,
        payload: validated as Prisma.InputJsonValue,
      },
      update: { payload: validated as Prisma.InputJsonValue },
    });
    return row.payload;
  },

  async getFooterConfig(): Promise<Prisma.JsonValue> {
    const row = await getPrisma().cmsSiteContent.findUnique({
      where: { key: CmsSiteContentKey.footer },
    });
    if (!row) return { v: 1, columns: [] } as Prisma.JsonValue;
    return row.payload;
  },

  async putFooterConfig(payload: unknown): Promise<Prisma.JsonValue> {
    const validated = assertSiteFooterPayload(payload);
    const row = await getPrisma().cmsSiteContent.upsert({
      where: { key: CmsSiteContentKey.footer },
      create: {
        key: CmsSiteContentKey.footer,
        payload: validated as Prisma.InputJsonValue,
      },
      update: { payload: validated as Prisma.InputJsonValue },
    });
    return row.payload;
  },

  async getAnnouncementsConfig(): Promise<Prisma.JsonValue> {
    const row = await getPrisma().cmsSiteContent.findUnique({
      where: { key: CmsSiteContentKey.announcements },
    });
    if (!row) return { v: 1, items: [] } as Prisma.JsonValue;
    return row.payload;
  },

  async putAnnouncementsConfig(payload: unknown): Promise<Prisma.JsonValue> {
    const validated = assertSiteAnnouncementsPayload(payload);
    const row = await getPrisma().cmsSiteContent.upsert({
      where: { key: CmsSiteContentKey.announcements },
      create: {
        key: CmsSiteContentKey.announcements,
        payload: validated as Prisma.InputJsonValue,
      },
      update: { payload: validated as Prisma.InputJsonValue },
    });
    return row.payload;
  },

  /** Storefront: active pages only; SEO nested under `seo` (no top-level SEO keys). */
  async listPublicPages() {
    const rows = await getPrisma().cmsPage.findMany({
      where: { isActive: true, published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        metaTitle: true,
        metaDescription: true,
        ogImage: true,
        ogTitle: true,
        ogDescription: true,
        canonicalUrl: true,
        noIndex: true,
        updatedAt: true,
      },
      orderBy: { title: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      updatedAt: row.updatedAt,
      seo: shapePublicCmsPageSeo(row),
    }));
  },

  /**
   * Storefront: resolve by **slug** or **id** (cuid). Only `isActive` pages; blocks filtered to `isActive`.
   * Response order: `id`, `slug`, `title`, `updatedAt`, `blocks`, then **`seo`** (nested object).
   */
  async getPublicPageBySlugOrId(identifier: string) {
    const trimmed = identifier.trim();
    if (!trimmed) return null;
    const row = await getPrisma().cmsPage.findFirst({
      where: {
        isActive: true,
        published: true,
        OR: [{ slug: trimmed }, { id: trimmed }],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        metaTitle: true,
        metaDescription: true,
        ogImage: true,
        ogTitle: true,
        ogDescription: true,
        canonicalUrl: true,
        noIndex: true,
        updatedAt: true,
        blocks: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            displayOrder: true,
            config: true,
          },
        },
      },
    });
    if (!row) return null;

    const blocks = row.blocks.map((b) => {
      const { sectionKey, content } = shapePublicBlock(b.config);
      return {
        id: b.id,
        displayOrder: b.displayOrder,
        sectionKey,
        content,
      };
    });

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      updatedAt: row.updatedAt,
      blocks,
      seo: shapePublicCmsPageSeo(row),
    };
  },
};

function assertSiteNavigationPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('navigation must be a JSON object');
  }
  const o = payload as Record<string, unknown>;
  if (o.v !== 1) throw new Error('navigation.v must be 1');
  if (!Array.isArray(o.items)) throw new Error('navigation.items must be an array');
  return o;
}

function assertSiteFooterPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('footer must be a JSON object');
  }
  const o = payload as Record<string, unknown>;
  if (o.v !== 1) throw new Error('footer.v must be 1');
  if (!Array.isArray(o.columns)) throw new Error('footer.columns must be an array');
  return o;
}

function assertSiteAnnouncementsPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('announcements must be a JSON object');
  }
  const o = payload as Record<string, unknown>;
  if (o.v !== 1) throw new Error('announcements.v must be 1');
  if (!Array.isArray(o.items)) throw new Error('announcements.items must be an array');
  return o;
}

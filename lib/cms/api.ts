import { api } from "@/lib/fetcher";
import {
  PUBLIC_CMS_ANNOUNCEMENTS_API_PATH,
  PUBLIC_CMS_FOOTER_API_PATH,
  PUBLIC_CMS_NAVIGATION_API_PATH,
} from "@/lib/cms/public-site-api-paths";
import type {
  CmsAnnouncementsConfig,
  CmsFooterConfig,
  CmsNavigationConfig,
} from "@/lib/cms/site-content-types";

// Block types
export const BLOCK_TYPES = [
  { type: "hero", label: "Hero Banner" },
  { type: "categories", label: "Categories Grid" },
  { type: "brands", label: "Brands Carousel" },
  { type: "featured_products", label: "Featured Products" },
  { type: "recommended", label: "Recommended Products" },
  { type: "editorial", label: "Editorial Section" },
  { type: "banner", label: "Promotional Banner" },
  { type: "text_block", label: "Text Block" },
] as const;

export type CmsBlockType = (typeof BLOCK_TYPES)[number]["type"];

export interface CmsLayoutRef {
  id: string;
  name: string;
  rootKey: string;
}

export interface CmsBlock {
  id: string;
  pageId: string;
  type: CmsBlockType;
  displayOrder: number;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Optional SEO / social metadata for storefront `<head>`; backend may omit until supported. */
export interface CmsPageSeoFields {
  metaTitle?: string | null;
  metaDescription?: string | null;
  /** Open Graph / Twitter card image URL */
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonicalUrl?: string | null;
  /** When true, suggest `noindex` to crawlers */
  noIndex?: boolean | null;
}

export interface CmsPage extends CmsPageSeoFields {
  id: string;
  slug: string;
  title: string;
  /** Enabled in CMS (not archived). */
  isActive: boolean;
  /** Live on public `/api/v1/cms/pages/...`. */
  published: boolean;
  /** Admin-only draft; public API ignores until Publish. */
  draftData?: unknown | null;
  layoutId: string | null;
  blocks: CmsBlock[];
  createdAt: string;
  updatedAt: string;
  layout?: CmsLayoutRef | null;
}

export interface CmsPagesResponse {
  success: boolean;
  pages: CmsPage[];
}

export interface CmsPageResponse {
  success: boolean;
  page: CmsPage;
}

export interface CmsBlockResponse {
  success: boolean;
  block: CmsBlock;
}

export interface CmsReorderResponse {
  success: boolean;
  page: CmsPage;
}

export interface CmsLayout {
  id: string;
  name: string;
  rootKey: string;
  schema: Record<string, unknown>;
  /** Optional screenshot / wireframe URL for editors (not part of `schema` JSON). */
  referenceImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsLayoutListItem {
  id: string;
  name: string;
  rootKey: string;
  referenceImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsLayoutsResponse {
  success: boolean;
  layouts: CmsLayoutListItem[];
}

export interface CmsLayoutResponse {
  success: boolean;
  layout: CmsLayout;
}

type CmsPageSeoCreatePatch = Partial<
  Pick<
    CmsPageSeoFields,
    | "metaTitle"
    | "metaDescription"
    | "ogImage"
    | "ogTitle"
    | "ogDescription"
    | "canonicalUrl"
    | "noIndex"
  >
>;

export type CmsPageCreateBody = {
  title: string;
  slug?: string;
  /** Storefront visibility. Legacy: `isActive` is accepted as an alias. */
  published?: boolean;
  /** @deprecated Use `published` for storefront visibility. */
  isActive?: boolean;
  layoutId?: string | null;
} & CmsPageSeoCreatePatch;

export type CmsPageUpdateBody = Partial<
  Pick<
    CmsPage,
    | "title"
    | "slug"
    | "isActive"
    | "published"
    | "draftData"
    | "layoutId"
    | "metaTitle"
    | "metaDescription"
    | "ogImage"
    | "ogTitle"
    | "ogDescription"
    | "canonicalUrl"
    | "noIndex"
  >
>;

export const cmsApi = {
  // Pages
  listPages: () => api.get<CmsPagesResponse>("/api/v1/admin/cms-pages/pages"),

  getPage: (id: string) =>
    api.get<CmsPageResponse>(`/api/v1/admin/cms-pages/pages/${id}`),

  createPage: (data: CmsPageCreateBody) =>
    api.post<CmsPageResponse>("/api/v1/admin/cms-pages/pages", data),

  updatePage: (id: string, data: CmsPageUpdateBody) =>
    api.patch<CmsPageResponse>(`/api/v1/admin/cms-pages/pages/${id}`, data),

  deletePage: (id: string) =>
    api.delete<{ success: boolean; message?: string }>(
      `/api/v1/admin/cms-pages/pages/${id}`
    ),

  // Blocks
  addBlock: (
    pageId: string,
    data: {
      type: CmsBlockType;
      config?: Record<string, unknown>;
      isActive?: boolean;
    }
  ) =>
    api.post<CmsBlockResponse>(
      `/api/v1/admin/cms-pages/pages/${pageId}/blocks`,
      data
    ),

  updateBlock: (
    blockId: string,
    data: {
      type?: CmsBlockType;
      config?: Record<string, unknown>;
      displayOrder?: number;
      isActive?: boolean;
    }
  ) =>
    api.patch<CmsBlockResponse>(
      `/api/v1/admin/cms-pages/blocks/${blockId}`,
      data
    ),

  deleteBlock: (blockId: string) =>
    api.delete<{ success: boolean; message?: string }>(
      `/api/v1/admin/cms-pages/blocks/${blockId}`
    ),

  reorderBlocks: (pageId: string, orderedBlockIds: string[]) =>
    api.post<CmsReorderResponse>(
      `/api/v1/admin/cms-pages/pages/${pageId}/reorder`,
      { orderedBlockIds }
    ),

  // Layouts
  listLayouts: () =>
    api.get<CmsLayoutsResponse>("/api/v1/admin/cms-pages/layouts"),

  getLayout: (id: string) =>
    api.get<CmsLayoutResponse>(`/api/v1/admin/cms-pages/layouts/${id}`),

  createLayout: (data: {
    name: string;
    rootKey: string;
    schema: Record<string, unknown>;
    referenceImageUrl?: string | null;
  }) =>
    api.post<CmsLayoutResponse>("/api/v1/admin/cms-pages/layouts", data),

  updateLayout: (
    id: string,
    data: {
      name?: string;
      rootKey?: string;
      schema?: Record<string, unknown>;
      referenceImageUrl?: string | null;
    }
  ) =>
    api.patch<CmsLayoutResponse>(`/api/v1/admin/cms-pages/layouts/${id}`, data),

  deleteLayout: (id: string) =>
    api.delete<{ success: boolean; message?: string }>(
      `/api/v1/admin/cms-pages/layouts/${id}`
    ),

  /** Site chrome — nested trees (backend may 404 until implemented; dashboard uses session fallback). */
  getNavigationConfig: () =>
    api.get<{ success: boolean; navigation: CmsNavigationConfig }>(
      "/api/v1/admin/cms-pages/navigation"
    ),

  putNavigationConfig: (data: CmsNavigationConfig) =>
    api.put<{ success: boolean; navigation: CmsNavigationConfig }>(
      "/api/v1/admin/cms-pages/navigation",
      data
    ),

  getFooterConfig: () =>
    api.get<{ success: boolean; footer: CmsFooterConfig }>(
      "/api/v1/admin/cms-pages/footer"
    ),

  putFooterConfig: (data: CmsFooterConfig) =>
    api.put<{ success: boolean; footer: CmsFooterConfig }>(
      "/api/v1/admin/cms-pages/footer",
      data
    ),

  getAnnouncementsConfig: () =>
    api.get<{ success: boolean; announcements: CmsAnnouncementsConfig }>(
      "/api/v1/admin/cms-pages/announcements"
    ),

  putAnnouncementsConfig: (data: CmsAnnouncementsConfig) =>
    api.put<{ success: boolean; announcements: CmsAnnouncementsConfig }>(
      "/api/v1/admin/cms-pages/announcements",
      data
    ),

  /**
   * Public storefront site chrome — flat JSON: **`success`** + layout root keys from the first
   * active section’s **`configValues`** (e.g. `announcement_under_construction`), not nested `announcements.sections`.
   */
  getPublicNavigation: () =>
    api.get<{ success: boolean } & Record<string, unknown>>(
      PUBLIC_CMS_NAVIGATION_API_PATH
    ),

  getPublicFooter: () =>
    api.get<{ success: boolean } & Record<string, unknown>>(
      PUBLIC_CMS_FOOTER_API_PATH
    ),

  getPublicAnnouncements: () =>
    api.get<{ success: boolean } & Record<string, unknown>>(
      PUBLIC_CMS_ANNOUNCEMENTS_API_PATH
    ),
};

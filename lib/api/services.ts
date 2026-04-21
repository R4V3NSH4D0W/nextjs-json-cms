/**
 * CMS API services — typed, domain-grouped wrappers over `lib/fetcher`.
 * All admin routes require an active session cookie (set by login).
 * Public routes are unauthenticated.
 */

import type {
  CmsPage,
  CmsBlock,
  CmsLayout,
  CmsLayoutListItem,
  CmsPageResponse,
  CmsPagesResponse,
  CmsBlockResponse,
  CmsLayoutResponse,
  CmsLayoutsResponse,
  CmsReorderResponse,
  CmsPageCreateBody,
  CmsPageUpdateBody,
} from '@/lib/cms/api';

import type {
  CmsNavigationConfig,
  CmsFooterConfig,
  CmsAnnouncementsConfig,
} from '@/lib/cms/site-content-types';

import { api } from '@/lib/fetcher';

// ─── Revalidation tags & durations ────────────────────────────────────────────

/** 5-minute ISR revalidation for public storefront data. */
const REVALIDATE = 300;

// ─── Generic envelope ─────────────────────────────────────────────────────────

type Ok<T> = { success: true } & T;

// ─── Admin — CMS Pages ────────────────────────────────────────────────────────

export const cmsPageApi = {
  /** List all pages (admin, auth required). */
  list: () =>
    api.get<Ok<{ pages: CmsPage[] }>>('/api/v1/admin/cms-pages/pages', {
      next: { tags: ['admin-cms-pages'] },
    }),

  /** Get a single page by ID (admin, auth required). */
  get: (pageId: string) =>
    api.get<CmsPageResponse>(`/api/v1/admin/cms-pages/pages/${pageId}`, {
      next: { tags: [`admin-cms-page-${pageId}`] },
    }),

  /** Create a new page. */
  create: (body: CmsPageCreateBody) =>
    api.post<CmsPageResponse>('/api/v1/admin/cms-pages/pages', body),

  /** Partially update a page. */
  update: (pageId: string, body: CmsPageUpdateBody) =>
    api.patch<CmsPageResponse>(`/api/v1/admin/cms-pages/pages/${pageId}`, body),

  /** Delete a page permanently. */
  remove: (pageId: string) =>
    api.delete<Ok<Record<never, never>>>(`/api/v1/admin/cms-pages/pages/${pageId}`),
};

// ─── Admin — CMS Blocks ───────────────────────────────────────────────────────

export const cmsBlockApi = {
  /** Add a new block to a page. */
  create: (
    pageId: string,
    body: { type: string; config?: unknown; isActive?: boolean },
  ) =>
    api.post<CmsBlockResponse>(
      `/api/v1/admin/cms-pages/pages/${pageId}/blocks`,
      body,
    ),

  /** Update a block's type, config, order, or visibility. */
  update: (
    blockId: string,
    body: Partial<{
      type: string;
      config: unknown;
      displayOrder: number;
      isActive: boolean;
    }>,
  ) =>
    api.patch<CmsBlockResponse>(
      `/api/v1/admin/cms-pages/blocks/${blockId}`,
      body,
    ),

  /** Delete a block. */
  remove: (blockId: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/cms-pages/blocks/${blockId}`,
    ),

  /** Reorder all blocks on a page in one shot. */
  reorder: (pageId: string, orderedBlockIds: string[]) =>
    api.post<CmsReorderResponse>(
      `/api/v1/admin/cms-pages/pages/${pageId}/reorder`,
      { orderedBlockIds },
    ),
};

// ─── Admin — CMS Layouts ──────────────────────────────────────────────────────

export const cmsLayoutApi = {
  /** List all layouts (summary fields only). */
  list: () =>
    api.get<CmsLayoutsResponse>('/api/v1/admin/cms-pages/layouts', {
      next: { tags: ['admin-cms-layouts'] },
    }),

  /** Get a full layout by ID (includes schema). */
  get: (id: string) =>
    api.get<CmsLayoutResponse>(`/api/v1/admin/cms-pages/layouts/${id}`, {
      next: { tags: [`admin-cms-layout-${id}`] },
    }),

  /** Create a new layout. */
  create: (body: {
    name: string;
    rootKey: string;
    schema: unknown;
    referenceImageUrl?: string | null;
  }) => api.post<CmsLayoutResponse>('/api/v1/admin/cms-pages/layouts', body),

  /** Update an existing layout. */
  update: (
    id: string,
    body: Partial<{
      name: string;
      rootKey: string;
      schema: unknown;
      referenceImageUrl: string | null;
    }>,
  ) =>
    api.patch<CmsLayoutResponse>(`/api/v1/admin/cms-pages/layouts/${id}`, body),

  /** Delete a layout. */
  remove: (id: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/cms-pages/layouts/${id}`,
    ),
};

// ─── Admin — Site chrome (Navigation / Footer / Announcements) ────────────────

export const adminSiteChromeApi = {
  // Navigation
  getNavigation: () =>
    api.get<Ok<{ navigation: CmsNavigationConfig }>>(
      '/api/v1/admin/cms-pages/navigation',
      { next: { tags: ['admin-navigation'] } },
    ),
  putNavigation: (payload: CmsNavigationConfig) =>
    api.put<Ok<{ navigation: CmsNavigationConfig }>>(
      '/api/v1/admin/cms-pages/navigation',
      payload,
    ),

  // Footer
  getFooter: () =>
    api.get<Ok<{ footer: CmsFooterConfig }>>(
      '/api/v1/admin/cms-pages/footer',
      { next: { tags: ['admin-footer'] } },
    ),
  putFooter: (payload: CmsFooterConfig) =>
    api.put<Ok<{ footer: CmsFooterConfig }>>(
      '/api/v1/admin/cms-pages/footer',
      payload,
    ),

  // Announcements
  getAnnouncements: () =>
    api.get<Ok<{ announcements: CmsAnnouncementsConfig }>>(
      '/api/v1/admin/cms-pages/announcements',
      { next: { tags: ['admin-announcements'] } },
    ),
  putAnnouncements: (payload: CmsAnnouncementsConfig) =>
    api.put<Ok<{ announcements: CmsAnnouncementsConfig }>>(
      '/api/v1/admin/cms-pages/announcements',
      payload,
    ),
};

// ─── Admin — Media Gallery ────────────────────────────────────────────────────

export type GalleryFile = { id: string; name: string; url: string };
export type GalleryListResponse = Ok<{
  folders: string[];
  files: GalleryFile[];
}>;

export const mediaApi = {
  /** List files and sub-folders in a gallery folder. */
  list: (folder?: string) =>
    api.get<GalleryListResponse>('/api/v1/admin/media/gallery/list', {
      params: folder ? { folder } : undefined,
      next: { tags: ['admin-media-gallery'] },
    }),

  /** Upload a file to the gallery. Pass `folder` query param to place it in a subfolder. */
  upload: (file: FormData, folder?: string) =>
    api.post<Ok<{ url: string; data: { url: string }; file: { url: string } }>>(
      folder
        ? `/api/v1/admin/media/gallery/upload?folder=${encodeURIComponent(folder)}`
        : '/api/v1/admin/media/gallery/upload',
      file,
    ),

  /** Create a new folder. */
  createFolder: (name: string, parent?: string) =>
    api.post<Ok<{ path: string }>>(
      '/api/v1/admin/media/gallery/folder',
      { name, parent },
    ),

  /** Delete a folder and its contents. */
  deleteFolder: (folder: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/media/gallery/folder?folder=${encodeURIComponent(folder)}`,
    ),

  /** Delete a single file by its public URL. */
  deleteFile: (url: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/media/gallery/file?url=${encodeURIComponent(url)}`,
    ),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type SessionUser = { id: string; email: string };

export const authApi = {
  login: (email: string, password: string) =>
    api.post<Ok<{ user: SessionUser }>>('/api/auth/login', { email, password }),

  logout: () => api.post<Ok<Record<never, never>>>('/api/auth/logout', {}),

  me: () =>
    api.get<Ok<{ user: SessionUser }>>('/api/auth/me', {
      next: { tags: ['session-me'], revalidate: false },
    }),
};

// ─── Public — Storefront CMS (no auth) ───────────────────────────────────────

export type PublicPage = {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
  seo: {
    metaTitle: string | null;
    metaDescription: string | null;
    ogImage: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
  };
};

export type PublicPageDetail = PublicPage & {
  blocks: {
    id: string;
    displayOrder: number;
    sectionKey: string | null;
    content: Record<string, unknown>;
  }[];
};

export const publicCmsApi = {
  /** List all published public pages. */
  listPages: () =>
    api.get<Ok<{ pages: PublicPage[] }>>('/api/v1/cms/pages', {
      next: { tags: ['public-cms-pages'], revalidate: REVALIDATE },
    }),

  /** Get a published page by slug or ID. Calls Next.js notFound() on 404. */
  getPage: (slugOrId: string) =>
    api.get<Ok<{ page: PublicPageDetail }>>(
      `/api/v1/cms/pages/${encodeURIComponent(slugOrId)}`,
      {
        next: {
          tags: [`public-cms-page-${slugOrId}`],
          revalidate: REVALIDATE,
        },
      },
    ),

  /** Public navigation config (storefront). */
  getNavigation: () =>
    api.get<Ok<{ navigation: CmsNavigationConfig }>>('/api/v1/cms/navigation', {
      next: { tags: ['public-navigation'], revalidate: REVALIDATE },
    }),

  /** Public footer config (storefront). */
  getFooter: () =>
    api.get<Ok<{ footer: CmsFooterConfig }>>('/api/v1/cms/footer', {
      next: { tags: ['public-footer'], revalidate: REVALIDATE },
    }),

  /** Public announcements config (storefront). */
  getAnnouncements: () =>
    api.get<Ok<{ announcements: CmsAnnouncementsConfig }>>(
      '/api/v1/cms/announcements',
      { next: { tags: ['public-announcements'], revalidate: REVALIDATE } },
    ),
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () =>
    api.get<{
      ok: boolean;
      service: string;
      timestamp: string;
      database: { connected: boolean; database?: string; user?: string; reason?: string };
    }>('/api/health'),
};

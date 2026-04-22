/**
 * CMS API services — typed, domain-grouped wrappers over `lib/fetcher`.
 * All admin routes require an active session cookie (set by login).
 * Public routes are unauthenticated.
 */

import type {
  CmsPage,
  CmsPageResponse,
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
  list: (projectSlug: string) =>
    api.get<Ok<{ pages: CmsPage[] }>>(`/api/v1/admin/projects/${projectSlug}/cms/pages`, {
      next: { tags: [`admin-cms-pages-${projectSlug}`] },
    }),

  /** Get a single page by ID (admin, auth required). */
  get: (projectSlug: string, pageId: string) =>
    api.get<CmsPageResponse>(`/api/v1/admin/projects/${projectSlug}/cms/pages/${pageId}`, {
      next: { tags: [`admin-cms-page-${pageId}`] },
    }),

  /** Create a new page. */
  create: (projectSlug: string, body: CmsPageCreateBody) =>
    api.post<CmsPageResponse>(`/api/v1/admin/projects/${projectSlug}/cms/pages`, body),

  /** Partially update a page. */
  update: (projectSlug: string, pageId: string, body: CmsPageUpdateBody) =>
    api.patch<CmsPageResponse>(`/api/v1/admin/projects/${projectSlug}/cms/pages/${pageId}`, body),

  /** Delete a page permanently. */
  remove: (projectSlug: string, pageId: string) =>
    api.delete<Ok<Record<never, never>>>(`/api/v1/admin/projects/${projectSlug}/cms/pages/${pageId}`),

  /** Restore a soft-deleted page. */
  restore: (projectSlug: string, pageId: string) =>
    api.post<CmsPageResponse>(
      `/api/v1/admin/projects/${projectSlug}/cms/pages/${pageId}/restore`,
      {},
    ),

  /** Permanently delete a page from the recycle bin. */
  purgeDeleted: (projectSlug: string, pageId: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/projects/${projectSlug}/cms/recycle/pages/${pageId}`,
    ),

  /** List soft-deleted pages with retention metadata. */
  listDeleted: (projectSlug: string) =>
    api.get<Ok<{ pages: Array<CmsPage & { deletedAt: string; purgeEligibleAt: string; retentionDays: number }> }>>(
      `/api/v1/admin/projects/${projectSlug}/cms/recycle/pages`,
    ),
};

// ─── Admin — CMS Blocks ───────────────────────────────────────────────────────

export const cmsBlockApi = {
  /** Add a new block to a page. */
  create: (
    projectSlug: string,
    pageId: string,
    body: { type: string; config?: unknown; isActive?: boolean },
  ) =>
    api.post<CmsBlockResponse>(
      `/api/v1/admin/projects/${projectSlug}/cms/pages/${pageId}/blocks`,
      body,
    ),

  /** Update a block's type, config, order, or visibility. */
  update: (
    projectSlug: string,
    blockId: string,
    body: Partial<{
      type: string;
      config: unknown;
      displayOrder: number;
      isActive: boolean;
    }>,
  ) =>
    api.patch<CmsBlockResponse>(
      `/api/v1/admin/projects/${projectSlug}/cms/blocks/${blockId}`,
      body,
    ),

  /** Delete a block. */
  remove: (projectSlug: string, blockId: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/projects/${projectSlug}/cms/blocks/${blockId}`,
    ),

  /** Restore a soft-deleted block. */
  restore: (projectSlug: string, blockId: string) =>
    api.post<CmsBlockResponse>(
      `/api/v1/admin/projects/${projectSlug}/cms/blocks/${blockId}/restore`,
      {},
    ),

  /** Permanently delete a block from the recycle bin. */
  purgeDeleted: (projectSlug: string, blockId: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/projects/${projectSlug}/cms/recycle/blocks/${blockId}`,
    ),

  /** List soft-deleted blocks with retention metadata. */
  listDeleted: (projectSlug: string) =>
    api.get<Ok<{ blocks: Array<{ id: string; type: string; pageId: string; page: { id: string; title: string; slug: string }; deletedAt: string; purgeEligibleAt: string; retentionDays: number }> }>>(
      `/api/v1/admin/projects/${projectSlug}/cms/recycle/blocks`,
    ),

  /** Reorder all blocks on a page in one shot. */
  reorder: (projectSlug: string, pageId: string, orderedBlockIds: string[]) =>
    api.post<CmsReorderResponse>(
      `/api/v1/admin/projects/${projectSlug}/cms/pages/${pageId}/reorder`,
      { orderedBlockIds },
    ),
};

// ─── Admin — CMS Layouts ──────────────────────────────────────────────────────

export const cmsLayoutApi = {
  /** List all layouts (summary fields only). */
  list: (projectSlug: string) =>
    api.get<CmsLayoutsResponse>(`/api/v1/admin/projects/${projectSlug}/cms/layouts`, {
      next: { tags: [`admin-cms-layouts-${projectSlug}`] },
    }),

  /** Get a full layout by ID (includes schema). */
  get: (projectSlug: string, id: string) =>
    api.get<CmsLayoutResponse>(`/api/v1/admin/projects/${projectSlug}/cms/layouts/${id}`, {
      next: { tags: [`admin-cms-layout-${id}`] },
    }),

  /** Create a new layout. */
  create: (projectSlug: string, body: {
    name: string;
    rootKey: string;
    schema: unknown;
    referenceImageUrl?: string | null;
  }) => api.post<CmsLayoutResponse>(`/api/v1/admin/projects/${projectSlug}/cms/layouts`, body),

  /** Update an existing layout. */
  update: (
    projectSlug: string,
    id: string,
    body: Partial<{
      name: string;
      rootKey: string;
      schema: unknown;
      referenceImageUrl: string | null;
    }>,
  ) =>
    api.patch<CmsLayoutResponse>(`/api/v1/admin/projects/${projectSlug}/cms/layouts/${id}`, body),

  /** Delete a layout. */
  remove: (projectSlug: string, id: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/projects/${projectSlug}/cms/layouts/${id}`,
    ),
};

// ─── Admin — Site chrome (Navigation / Footer / Announcements) ────────────────

export const adminSiteChromeApi = {
  // Navigation
  getNavigation: (projectSlug: string) =>
    api.get<Ok<{ navigation: CmsNavigationConfig }>>(
      `/api/v1/admin/projects/${projectSlug}/cms/navigation`,
      { next: { tags: [`admin-navigation-${projectSlug}`] } },
    ),
  putNavigation: (projectSlug: string, payload: CmsNavigationConfig) =>
    api.put<Ok<{ navigation: CmsNavigationConfig }>>(
      `/api/v1/admin/projects/${projectSlug}/cms/navigation`,
      payload,
    ),

  // Footer
  getFooter: (projectSlug: string) =>
    api.get<Ok<{ footer: CmsFooterConfig }>>(
      `/api/v1/admin/projects/${projectSlug}/cms/footer`,
      { next: { tags: [`admin-footer-${projectSlug}`] } },
    ),
  putFooter: (projectSlug: string, payload: CmsFooterConfig) =>
    api.put<Ok<{ footer: CmsFooterConfig }>>(
      `/api/v1/admin/projects/${projectSlug}/cms/footer`,
      payload,
    ),

  // Announcements
  getAnnouncements: (projectSlug: string) =>
    api.get<Ok<{ announcements: CmsAnnouncementsConfig }>>(
      `/api/v1/admin/projects/${projectSlug}/cms/announcements`,
      { next: { tags: [`admin-announcements-${projectSlug}`] } },
    ),
  putAnnouncements: (projectSlug: string, payload: CmsAnnouncementsConfig) =>
    api.put<Ok<{ announcements: CmsAnnouncementsConfig }>>(
      `/api/v1/admin/projects/${projectSlug}/cms/announcements`,
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
  list: (projectSlug: string, folder?: string) =>
    api.get<GalleryListResponse>(`/api/v1/admin/projects/${projectSlug}/media/gallery/list`, {
      params: folder ? { folder } : undefined,
      next: { tags: [`admin-media-gallery-${projectSlug}`] },
    }),

  /** Upload a file to the gallery. Pass `folder` query param to place it in a subfolder. */
  upload: (projectSlug: string, file: FormData, folder?: string) =>
    api.post<Ok<{ url: string; data: { url: string }; file: { url: string } }>>(
      folder
        ? `/api/v1/admin/projects/${projectSlug}/media/gallery/upload?folder=${encodeURIComponent(folder)}`
        : `/api/v1/admin/projects/${projectSlug}/media/gallery/upload`,
      file,
    ),

  /** Create a new folder. */
  createFolder: (projectSlug: string, name: string, parent?: string) =>
    api.post<Ok<{ path: string }>>(
      `/api/v1/admin/projects/${projectSlug}/media/gallery/folder`,
      { name, parent },
    ),

  /** Delete a folder and its contents. */
  deleteFolder: (projectSlug: string, folder: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/projects/${projectSlug}/media/gallery/folder?folder=${encodeURIComponent(folder)}`,
    ),

  /** Delete a single file by its public URL. */
  deleteFile: (projectSlug: string, url: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/projects/${projectSlug}/media/gallery/file?url=${encodeURIComponent(url)}`,
    ),

  /** List media trash items. */
  listTrash: (projectSlug: string) =>
    api.get<Ok<{ items: Array<{ trashKey: string; type: "file" | "folder"; name: string; originalRelativePath: string | null; previewUrl: string | null; deletedAt: string; purgeEligibleAt: string; retentionDays: number }> }>>(
      `/api/v1/admin/projects/${projectSlug}/media/gallery/trash/list`,
    ),

  /** Restore a media item from trash into project media folder. */
  restoreFromTrash: (projectSlug: string, body: { trashKey: string; folder?: string }) =>
    api.post<Ok<{ item: { url: string; name: string } }>>(
      `/api/v1/admin/projects/${projectSlug}/media/gallery/trash/restore`,
      body,
    ),

  /** Permanently delete a media item from the recycle bin. */
  purgeTrashItem: (projectSlug: string, trashKey: string) =>
    api.delete<Ok<Record<never, never>>>(
      `/api/v1/admin/projects/${projectSlug}/media/gallery/trash?trashKey=${encodeURIComponent(trashKey)}`,
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
    api.get<Ok<{ pages: PublicPage[] }>>('/api/v1/pages', {
      next: { tags: ['public-cms-pages'], revalidate: REVALIDATE },
    }),

  /** Get a published page by slug or ID. Calls Next.js notFound() on 404. */
  getPage: (slugOrId: string) =>
    api.get<Ok<{ page: PublicPageDetail }>>(
      `/api/v1/pages/${encodeURIComponent(slugOrId)}`,
      {
        next: {
          tags: [`public-cms-page-${slugOrId}`],
          revalidate: REVALIDATE,
        },
      },
    ),

  /** Public navigation config (storefront). */
  getNavigation: () =>
    api.get<Ok<{ navigation: CmsNavigationConfig }>>('/api/v1/navigation', {
      next: { tags: ['public-navigation'], revalidate: REVALIDATE },
    }),

  /** Public footer config (storefront). */
  getFooter: () =>
    api.get<Ok<{ footer: CmsFooterConfig }>>('/api/v1/footer', {
      next: { tags: ['public-footer'], revalidate: REVALIDATE },
    }),

  /** Public announcements config (storefront). */
  getAnnouncements: () =>
    api.get<Ok<{ announcements: CmsAnnouncementsConfig }>>(
      '/api/v1/announcements',
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

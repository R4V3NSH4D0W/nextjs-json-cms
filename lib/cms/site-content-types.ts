/**
 * JSON shapes for CMS site chrome: navigation, footer, announcements.
 * Stored as a single versioned document per area (API or local draft).
 */

import type { CmsNewPageLayoutSlot } from "./new-page-draft";
import { normalizeSiteLayoutSections } from "./site-layout-sections";

export const CMS_NAVIGATION_CONFIG_V = 1 as const;
export const CMS_FOOTER_CONFIG_V = 1 as const;
export const CMS_ANNOUNCEMENTS_CONFIG_V = 1 as const;

/** Recursive menu / footer link node */
export interface CmsLinkNode {
  id: string;
  label: string;
  href: string;
  openInNewTab?: boolean;
  children: CmsLinkNode[];
}

export interface CmsNavigationConfig {
  v: typeof CMS_NAVIGATION_CONFIG_V;
  items: CmsLinkNode[];
  /**
   * Optional layout-driven sections (same slot model as CMS pages).
   * Coexists with structured `items`; storefront chooses how to consume either or both.
   */
  sections?: CmsNewPageLayoutSlot[];
  /** Optional wireframe / mockup for the navbar (not used by storefront unless you wire it). */
  referenceImageUrl?: string | null;
}

export interface CmsFooterColumn {
  id: string;
  title: string;
  links: CmsLinkNode[];
}

export interface CmsFooterConfig {
  v: typeof CMS_FOOTER_CONFIG_V;
  columns: CmsFooterColumn[];
  /** Optional layout-driven sections (same slot model as CMS pages). */
  sections?: CmsNewPageLayoutSlot[];
  /** Optional wireframe / mockup for the footer layout. */
  referenceImageUrl?: string | null;
}

/** Nested announcements (e.g. grouped or regional variants) */
export interface CmsAnnouncementNode {
  id: string;
  title: string;
  body: string;
  href?: string;
  openInNewTab?: boolean;
  isActive?: boolean;
  dismissible?: boolean;
  children: CmsAnnouncementNode[];
}

export interface CmsAnnouncementsConfig {
  v: typeof CMS_ANNOUNCEMENTS_CONFIG_V;
  items: CmsAnnouncementNode[];
  /**
   * When `false`, the storefront should hide the announcement bar entirely.
   * Omitted or `true` means visible (subject to per-item `isActive`, etc.).
   */
  enabled?: boolean;
  /** Optional layout-driven sections (same slot model as CMS pages). */
  sections?: CmsNewPageLayoutSlot[];
  /** Optional wireframe / mockup for the announcement strip (site chrome preview on page editor). */
  referenceImageUrl?: string | null;
}

export function createLinkNode(partial?: Partial<CmsLinkNode>): CmsLinkNode {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    label: partial?.label ?? "",
    href: partial?.href ?? "",
    openInNewTab: partial?.openInNewTab,
    children: partial?.children ?? [],
  };
}

export function createFooterColumn(
  partial?: Partial<CmsFooterColumn>
): CmsFooterColumn {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `col-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: partial?.title ?? "",
    links: partial?.links ?? [],
  };
}

export function createAnnouncementNode(
  partial?: Partial<CmsAnnouncementNode>
): CmsAnnouncementNode {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `ann-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: partial?.title ?? "",
    body: partial?.body ?? "",
    href: partial?.href,
    openInNewTab: partial?.openInNewTab,
    isActive: partial?.isActive ?? true,
    dismissible: partial?.dismissible ?? true,
    children: partial?.children ?? [],
  };
}

export function defaultNavigationConfig(): CmsNavigationConfig {
  return { v: CMS_NAVIGATION_CONFIG_V, items: [] };
}

export function defaultFooterConfig(): CmsFooterConfig {
  return { v: CMS_FOOTER_CONFIG_V, columns: [] };
}

export function defaultAnnouncementsConfig(): CmsAnnouncementsConfig {
  return { v: CMS_ANNOUNCEMENTS_CONFIG_V, items: [] };
}

function normalizeLinkNode(raw: unknown): CmsLinkNode {
  if (!raw || typeof raw !== "object") return createLinkNode();
  const o = raw as Record<string, unknown>;
  const children = Array.isArray(o.children)
    ? o.children.map(normalizeLinkNode)
    : [];
  const base = createLinkNode();
  return {
    id: typeof o.id === "string" && o.id.trim() ? o.id : base.id,
    label: typeof o.label === "string" ? o.label : "",
    href: typeof o.href === "string" ? o.href : "",
    openInNewTab: o.openInNewTab === true,
    children,
  };
}

function normalizeReferenceImageUrl(
  raw: unknown
): string | null | undefined {
  if (raw === null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    return t === "" ? null : t;
  }
  return undefined;
}

export function normalizeNavigationConfig(raw: unknown): CmsNavigationConfig {
  if (!raw || typeof raw !== "object") return defaultNavigationConfig();
  const o = raw as Record<string, unknown>;
  if (o.v !== CMS_NAVIGATION_CONFIG_V) return defaultNavigationConfig();
  const items = Array.isArray(o.items) ? o.items.map(normalizeLinkNode) : [];
  const ref = normalizeReferenceImageUrl(o.referenceImageUrl);
  const sectionsRaw = Array.isArray(o.sections)
    ? normalizeSiteLayoutSections(o.sections)
    : undefined;
  /** Navbar layout mode: at most one layout section. */
  const sections =
    sectionsRaw !== undefined && sectionsRaw.length > 0
      ? sectionsRaw.slice(0, 1)
      : undefined;
  return {
    v: CMS_NAVIGATION_CONFIG_V,
    items,
    ...(sections !== undefined && sections.length > 0 ? { sections } : {}),
    ...(ref !== undefined ? { referenceImageUrl: ref } : {}),
  };
}

function normalizeFooterColumn(raw: unknown): CmsFooterColumn {
  if (!raw || typeof raw !== "object") return createFooterColumn();
  const o = raw as Record<string, unknown>;
  const links = Array.isArray(o.links) ? o.links.map(normalizeLinkNode) : [];
  const base = createFooterColumn();
  return {
    id: typeof o.id === "string" && o.id.trim() ? o.id : base.id,
    title: typeof o.title === "string" ? o.title : "",
    links,
  };
}

export function normalizeFooterConfig(raw: unknown): CmsFooterConfig {
  if (!raw || typeof raw !== "object") return defaultFooterConfig();
  const o = raw as Record<string, unknown>;
  if (o.v !== CMS_FOOTER_CONFIG_V) return defaultFooterConfig();
  const columns = Array.isArray(o.columns)
    ? o.columns.map(normalizeFooterColumn)
    : [];
  const ref = normalizeReferenceImageUrl(o.referenceImageUrl);
  const sectionsRaw = Array.isArray(o.sections)
    ? normalizeSiteLayoutSections(o.sections)
    : undefined;
  /** Footer layout mode: at most one layout section. */
  const sections =
    sectionsRaw !== undefined && sectionsRaw.length > 0
      ? sectionsRaw.slice(0, 1)
      : undefined;
  return {
    v: CMS_FOOTER_CONFIG_V,
    columns,
    ...(sections !== undefined && sections.length > 0 ? { sections } : {}),
    ...(ref !== undefined ? { referenceImageUrl: ref } : {}),
  };
}

function normalizeAnnouncementNode(raw: unknown): CmsAnnouncementNode {
  if (!raw || typeof raw !== "object") return createAnnouncementNode();
  const o = raw as Record<string, unknown>;
  const children = Array.isArray(o.children)
    ? o.children.map(normalizeAnnouncementNode)
    : [];
  const base = createAnnouncementNode();
  return {
    id: typeof o.id === "string" && o.id.trim() ? o.id : base.id,
    title: typeof o.title === "string" ? o.title : "",
    body: typeof o.body === "string" ? o.body : "",
    href: typeof o.href === "string" ? o.href : undefined,
    openInNewTab: o.openInNewTab === true,
    isActive: o.isActive !== false,
    dismissible: o.dismissible !== false,
    children,
  };
}

export function normalizeAnnouncementsConfig(
  raw: unknown
): CmsAnnouncementsConfig {
  if (!raw || typeof raw !== "object") return defaultAnnouncementsConfig();
  const o = raw as Record<string, unknown>;
  if (o.v !== CMS_ANNOUNCEMENTS_CONFIG_V) return defaultAnnouncementsConfig();
  const items = Array.isArray(o.items)
    ? o.items.map(normalizeAnnouncementNode)
    : [];
  const sectionsRaw = Array.isArray(o.sections)
    ? normalizeSiteLayoutSections(o.sections)
    : undefined;
  /** Announcements layout mode: at most one layout section (same as navbar/footer). */
  const sections =
    sectionsRaw !== undefined && sectionsRaw.length > 0
      ? sectionsRaw.slice(0, 1)
      : undefined;
  const ref = normalizeReferenceImageUrl(o.referenceImageUrl);
  const enabled = o.enabled !== false;
  return {
    v: CMS_ANNOUNCEMENTS_CONFIG_V,
    items,
    ...(enabled ? {} : { enabled: false }),
    ...(sections !== undefined && sections.length > 0 ? { sections } : {}),
    ...(ref !== undefined ? { referenceImageUrl: ref } : {}),
  };
}

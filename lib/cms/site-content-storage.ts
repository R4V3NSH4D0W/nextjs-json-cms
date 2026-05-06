import type {
  CmsAnnouncementsConfig,
  CmsFooterConfig,
  CmsNavigationConfig,
} from "@/lib/cms/site-content-types";
import {
  CMS_ANNOUNCEMENTS_CONFIG_V,
  CMS_FOOTER_CONFIG_V,
  CMS_NAVIGATION_CONFIG_V,
} from "@/lib/cms/site-content-types";

const KEY_NAV = "projects-cms:cms-navigation-v1";
const KEY_FOOTER = "projects-cms:cms-footer-v1";
const KEY_ANN = "projects-cms:cms-announcements-v1";

function keyFor(base: string, projectSlug: string) {
  return `${base}:${projectSlug}`;
}

function isNav(o: unknown): o is CmsNavigationConfig {
  return (
    !!o &&
    typeof o === "object" &&
    (o as CmsNavigationConfig).v === CMS_NAVIGATION_CONFIG_V &&
    Array.isArray((o as CmsNavigationConfig).items)
  );
}

function isFooter(o: unknown): o is CmsFooterConfig {
  return (
    !!o &&
    typeof o === "object" &&
    (o as CmsFooterConfig).v === CMS_FOOTER_CONFIG_V &&
    Array.isArray((o as CmsFooterConfig).columns)
  );
}

function isAnn(o: unknown): o is CmsAnnouncementsConfig {
  return (
    !!o &&
    typeof o === "object" &&
    (o as CmsAnnouncementsConfig).v === CMS_ANNOUNCEMENTS_CONFIG_V &&
    Array.isArray((o as CmsAnnouncementsConfig).items)
  );
}

export function loadNavigationFromStorage(projectSlug: string): CmsNavigationConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(keyFor(KEY_NAV, projectSlug));
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    return isNav(o) ? o : null;
  } catch {
    return null;
  }
}

export function saveNavigationToStorage(projectSlug: string, data: CmsNavigationConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(KEY_NAV, projectSlug), JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadFooterFromStorage(projectSlug: string): CmsFooterConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(keyFor(KEY_FOOTER, projectSlug));
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    return isFooter(o) ? o : null;
  } catch {
    return null;
  }
}

export function saveFooterToStorage(projectSlug: string, data: CmsFooterConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(KEY_FOOTER, projectSlug), JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadAnnouncementsFromStorage(projectSlug: string): CmsAnnouncementsConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(keyFor(KEY_ANN, projectSlug));
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    return isAnn(o) ? o : null;
  } catch {
    return null;
  }
}

export function saveAnnouncementsToStorage(projectSlug: string, data: CmsAnnouncementsConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(KEY_ANN, projectSlug), JSON.stringify(data));
  } catch {
    // ignore
  }
}

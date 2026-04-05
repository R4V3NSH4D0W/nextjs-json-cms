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

const KEY_NAV = "ecommerce-dashboard:cms-navigation-v1";
const KEY_FOOTER = "ecommerce-dashboard:cms-footer-v1";
const KEY_ANN = "ecommerce-dashboard:cms-announcements-v1";

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

export function loadNavigationFromStorage(): CmsNavigationConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY_NAV);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    return isNav(o) ? o : null;
  } catch {
    return null;
  }
}

export function saveNavigationToStorage(data: CmsNavigationConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_NAV, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadFooterFromStorage(): CmsFooterConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY_FOOTER);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    return isFooter(o) ? o : null;
  } catch {
    return null;
  }
}

export function saveFooterToStorage(data: CmsFooterConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_FOOTER, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadAnnouncementsFromStorage(): CmsAnnouncementsConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY_ANN);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    return isAnn(o) ? o : null;
  } catch {
    return null;
  }
}

export function saveAnnouncementsToStorage(data: CmsAnnouncementsConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_ANN, JSON.stringify(data));
  } catch {
    // ignore
  }
}

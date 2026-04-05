/** Per-page scope: `"new"` for /dashboard/cms/new, or the CMS page id for /dashboard/cms/pages/[id]. */
export const CMS_SECTIONS_EXPAND_SCOPE_NEW = "new";

const STORAGE_KEY_PREFIX = "cms-dashboard:page-sections-expanded:";

/** Persisted when user clicks Expand / Collapse on new or edit page. */
export type SectionsExpandPref = "expanded" | "collapsed";

export function sectionsExpandedStorageKey(scope: string): string {
  return `${STORAGE_KEY_PREFIX}${scope}`;
}

export function readSectionsExpandedPref(scope: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const scoped = localStorage.getItem(sectionsExpandedStorageKey(scope));
    if (scoped === "collapsed") return false;
    if (scoped === "expanded") return true;
    // Legacy: single global key before per-page storage
    const legacy = localStorage.getItem("cms-dashboard:page-sections-expanded");
    if (legacy === "collapsed") return false;
    if (legacy === "expanded") return true;
    return true;
  } catch {
    return true;
  }
}

export function writeSectionsExpandedPref(
  scope: string,
  mode: SectionsExpandPref
): void {
  try {
    localStorage.setItem(sectionsExpandedStorageKey(scope), mode);
  } catch {
    /* quota / private mode */
  }
}

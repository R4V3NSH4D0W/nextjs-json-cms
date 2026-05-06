/**
 * Public storefront CMS routes (no admin auth), parallel to
 * `GET /api/v1/pages` / `GET /api/v1/pages/:slugOrId`.
 *
 * **Site chrome** responses are **flat**: `{ success: true, ...layoutRootKeys }` from the first
 * active section’s **`configValues`**. **Announcements** when **`enabled: false`**: only
 * `{ success: true, enabled: false }` — no layout keys. Not the nested admin document shape.
 */

export function publicCmsNavigationApiPath() {
  return `/api/v1/navigation`;
}

export function publicCmsFooterApiPath() {
  return `/api/v1/footer`;
}

export function publicCmsAnnouncementsApiPath() {
  return `/api/v1/announcements`;
}

export function publicCmsPageApiPath(slugOrId: string) {
  return `/api/v1/pages/${encodeURIComponent(slugOrId)}`;
}

/** Short label for long API paths (middle ellipsis). */
export function trimPublicApiPathDisplay(path: string, max = 42): string {
  const t = path.trim();
  if (t.length <= max) return t;
  const head = Math.floor((max - 1) / 2);
  const tail = max - 1 - head;
  return `${t.slice(0, head)}…${t.slice(-tail)}`;
}

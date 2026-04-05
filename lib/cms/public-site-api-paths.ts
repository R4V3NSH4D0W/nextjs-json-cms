/**
 * Public storefront CMS routes (no admin auth), parallel to
 * `GET /api/v1/cms/pages` / `GET /api/v1/cms/pages/:slugOrId`.
 *
 * **Site chrome** responses are **flat**: `{ success: true, ...layoutRootKeys }` from the first
 * active section’s **`configValues`**. **Announcements** when **`enabled: false`**: only
 * `{ success: true, enabled: false }` — no layout keys. Not the nested admin document shape.
 */

export const PUBLIC_CMS_NAVIGATION_API_PATH = "/api/v1/cms/navigation";

export const PUBLIC_CMS_FOOTER_API_PATH = "/api/v1/cms/footer";

export const PUBLIC_CMS_ANNOUNCEMENTS_API_PATH = "/api/v1/cms/announcements";

/** Short label for long API paths (middle ellipsis). */
export function trimPublicApiPathDisplay(path: string, max = 42): string {
  const t = path.trim();
  if (t.length <= max) return t;
  const head = Math.floor((max - 1) / 2);
  const tail = max - 1 - head;
  return `${t.slice(0, head)}…${t.slice(-tail)}`;
}

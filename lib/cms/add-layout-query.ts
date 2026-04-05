/**
 * Appends `addLayoutId` and `addLayoutNonce` so each return from the layouts list
 * has a unique query string (same layout can be added again; edit page effect
 * won't skip processing).
 */
export function appendAddLayoutIdToUrl(path: string, layoutId: string): string {
  const sep = path.includes("?") ? "&" : "?";
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return `${path}${sep}addLayoutId=${encodeURIComponent(layoutId)}&addLayoutNonce=${encodeURIComponent(nonce)}`;
}

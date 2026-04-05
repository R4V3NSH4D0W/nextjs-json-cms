import { headers } from "next/headers";

import type { PublicCmsPage, PublicPageResponse } from "@/lib/cms/public-page-types";

/**
 * Server-only: loads a published CMS page from the same-origin public API.
 */
export async function fetchPublicCmsPageBySlug(
  slug: string,
): Promise<PublicCmsPage | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";

  try {
    const url = `${proto}://${host}/api/v1/cms/pages/${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as PublicPageResponse;
    return data.page;
  } catch {
    return null;
  }
}

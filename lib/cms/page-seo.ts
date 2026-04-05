import type { CmsPage, CmsPageSeoFields } from "@/lib/cms/api";

/** Local form state for CMS page SEO (empty strings = unset). */
export interface CmsPageSeoFormValues {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
}

export function emptyCmsPageSeoFormValues(): CmsPageSeoFormValues {
  return {
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    ogTitle: "",
    ogDescription: "",
    canonicalUrl: "",
    noIndex: false,
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function cmsPageSeoFormValuesFromApi(
  page: Partial<CmsPage> | null | undefined
): CmsPageSeoFormValues {
  if (!page) return emptyCmsPageSeoFormValues();
  return {
    metaTitle: str(page.metaTitle),
    metaDescription: str(page.metaDescription),
    ogImage: str(page.ogImage),
    ogTitle: str(page.ogTitle),
    ogDescription: str(page.ogDescription),
    canonicalUrl: str(page.canonicalUrl),
    noIndex: page.noIndex === true,
  };
}

export function normalizeCmsPageSeoDraft(
  raw: unknown
): CmsPageSeoFormValues {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyCmsPageSeoFormValues();
  }
  const o = raw as Record<string, unknown>;
  const base = emptyCmsPageSeoFormValues();
  return {
    metaTitle: str(o.metaTitle),
    metaDescription: str(o.metaDescription),
    ogImage: str(o.ogImage),
    ogTitle: str(o.ogTitle),
    ogDescription: str(o.ogDescription),
    canonicalUrl: str(o.canonicalUrl),
    noIndex: o.noIndex === true,
  };
}

/**
 * Builds API patch fields: trims strings; omits empty optional strings;
 * always includes `noIndex` so the API can persist the flag.
 */
export function toCmsPageSeoApiPatch(
  values: CmsPageSeoFormValues
): Pick<
  CmsPageSeoFields,
  | "metaTitle"
  | "metaDescription"
  | "ogImage"
  | "ogTitle"
  | "ogDescription"
  | "canonicalUrl"
  | "noIndex"
> {
  const t = (s: string) => s.trim();
  return {
    ...(t(values.metaTitle) ? { metaTitle: t(values.metaTitle) } : {}),
    ...(t(values.metaDescription)
      ? { metaDescription: t(values.metaDescription) }
      : {}),
    ...(t(values.ogImage) ? { ogImage: t(values.ogImage) } : {}),
    ...(t(values.ogTitle) ? { ogTitle: t(values.ogTitle) } : {}),
    ...(t(values.ogDescription)
      ? { ogDescription: t(values.ogDescription) }
      : {}),
    ...(t(values.canonicalUrl)
      ? { canonicalUrl: t(values.canonicalUrl) }
      : {}),
    noIndex: values.noIndex,
  };
}

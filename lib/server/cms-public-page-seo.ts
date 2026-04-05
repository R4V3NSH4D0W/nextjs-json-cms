/**
 * Public storefront API: SEO is nested under `seo` (not top-level on the page).
 * @see cms-service `listPublicPages` / `getPublicPageBySlugOrId`
 */

export interface PublicCmsPageSeo {
  metaTitle: null | string;
  metaDescription: null | string;
  ogImage: null | string;
  ogTitle: null | string;
  ogDescription: null | string;
  canonicalUrl: null | string;
  noIndex: boolean;
}

export function shapePublicCmsPageSeo(row: PublicCmsPageSeo): PublicCmsPageSeo {
  return {
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    canonicalUrl: row.canonicalUrl,
    noIndex: row.noIndex,
  };
}

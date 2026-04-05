/** Align with dashboard `CmsPageSeoFields` / `cms-backend-seo.md`. */

const SEO_STRING_KEYS = [
  'metaTitle',
  'metaDescription',
  'ogImage',
  'ogTitle',
  'ogDescription',
  'canonicalUrl',
] as const;

const SEO_STRING_MAX_LEN = 500;

export type CmsPageSeoParsed = {
  metaTitle?: null | string;
  metaDescription?: null | string;
  ogImage?: null | string;
  ogTitle?: null | string;
  ogDescription?: null | string;
  canonicalUrl?: null | string;
  noIndex?: boolean;
};

/**
 * Reads optional SEO keys from JSON body. Omitted keys are not present on the result.
 * `null` or empty string clears to `null` (for PATCH). Strings are trimmed and capped.
 */
export function parseCmsPageSeoFromBody(body: Record<string, unknown>): CmsPageSeoParsed {
  const out: CmsPageSeoParsed = {};

  for (const key of SEO_STRING_KEYS) {
    if (!(key in body) || body[key] === undefined) continue;
    const v = body[key];
    if (v === null) {
      out[key] = null;
      continue;
    }
    if (typeof v !== 'string') {
      throw new Error(`${key} must be a string or null`);
    }
    const t = v.trim();
    if (t.length > SEO_STRING_MAX_LEN) {
      out[key] = t.slice(0, SEO_STRING_MAX_LEN);
    } else {
      out[key] = t === '' ? null : t;
    }
  }

  if ('noIndex' in body && body.noIndex !== undefined) {
    if (typeof body.noIndex !== 'boolean') {
      throw new Error('noIndex must be a boolean');
    }
    out.noIndex = body.noIndex;
  }

  return out;
}

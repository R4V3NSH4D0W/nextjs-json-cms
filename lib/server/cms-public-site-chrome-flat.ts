/**
 * Public site chrome: flatten the first **active** layout slot’s **`configValues`**
 * next to **`success`** (no `sections` / `configValues` wrappers). Strips **`__*`** keys.
 * Optional document fields (`enabled`, `items`, `columns`, `v`) merged when present.
 */

import type { JsonValue } from "@/lib/generated/prisma/internal/prismaNamespace";

import { stripInternalKeysDeep } from "@/lib/server/cms-public-block";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function firstActiveSection(sections: unknown): null | Record<string, unknown> {
  if (!Array.isArray(sections)) return null;
  for (const s of sections) {
    if (!isPlainObject(s)) continue;
    if (s.isActive === false) continue;
    return s;
  }
  return null;
}

/**
 * Returns stripped **`configValues`** from the first active section, or `{}`.
 */
export function flattenFirstSectionConfigValues(raw: JsonValue): Record<string, unknown> {
  if (!isPlainObject(raw)) return {};
  const slot = firstActiveSection(raw.sections);
  if (!slot) return {};
  const cv = slot.configValues;
  if (!isPlainObject(cv)) return {};
  const stripped = stripInternalKeysDeep(cv);
  if (!isPlainObject(stripped)) return {};
  return stripped as Record<string, unknown>;
}

export type SiteChromeFlatKind = 'footer' | 'navigation' | 'announcements';

/**
 * `{ success: true, ...layoutRootKeysFromConfigValues, ...optionalMeta }`
 */
export function buildPublicSiteChromeFlatResponse(
  raw: JsonValue,
  kind: SiteChromeFlatKind
): Record<string, unknown> {
  const o = isPlainObject(raw) ? raw : {};

  /** Bar hidden in dashboard — no layout keys or tree payload for the storefront. */
  if (kind === 'announcements' && o.enabled === false) {
    return { success: true, enabled: false };
  }

  const spread = flattenFirstSectionConfigValues(raw);

  const body: Record<string, unknown> = {
    success: true,
    ...spread,
  };

  if (Array.isArray(o.items) && o.items.length > 0) {
    body.items = o.items;
    if (o.v !== undefined && o.v !== null) body.v = o.v;
  }
  if (kind === 'footer' && Array.isArray(o.columns) && o.columns.length > 0) {
    body.columns = o.columns;
    if (o.v !== undefined && o.v !== null) body.v = o.v;
  }

  return body;
}

/**
 * Shapes CMS blocks for **public** storefront responses only.
 * Strips editor metadata (`__*` keys) and exposes **which section to render** plus flat **content**.
 */

/** Strips `__*` keys (editor metadata) for public JSON. */
export function stripInternalKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(stripInternalKeysDeep);
  }
  const o = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (k.startsWith('__')) continue;
    out[k] = stripInternalKeysDeep(v);
  }
  return out;
}

export type PublicBlockShape = {
  /**
   * Which layout section / slot this block represents (e.g. `home_hero`, `home_explore`).
   * Use this to pick a React component: `registry[sectionKey]` or switch(sectionKey).
   */
  sectionKey: null | string;
  /** Field values for that section only (badges, titles, images, …) */
  content: Record<string, unknown>;
};

/**
 * Picks the primary section key from dashboard `config`:
 * - Prefers any key other than generic `section` when both exist (e.g. `home_hero` over `section`).
 * - Uses insertion order for the first matching key.
 * - `content` is only the inner object for that key (not a merge of unrelated sections).
 */
export function shapePublicBlock(config: unknown): PublicBlockShape {
  const stripped = stripInternalKeysDeep(config);
  if (typeof stripped !== 'object' || stripped === null || Array.isArray(stripped)) {
    return { sectionKey: null, content: {} };
  }
  const o = stripped as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length === 0) {
    return { sectionKey: null, content: {} };
  }

  const primaryKey = keys.find((k) => k !== 'section') ?? keys[0];
  const v = o[primaryKey];

  if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
    return {
      sectionKey: primaryKey,
      content: { ...(v as Record<string, unknown>) },
    };
  }

  return {
    sectionKey: primaryKey,
    content: { [primaryKey]: v },
  };
}

/** @deprecated Use shapePublicBlock — kept for any import sites */
export function simplifyBlockConfigForPublic(config: unknown): Record<string, unknown> {
  return shapePublicBlock(config).content;
}

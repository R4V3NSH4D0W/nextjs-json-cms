/**
 * Generates `lib/cms/generated/public-sections.ts` from:
 * - `lib/cms/codegen/layout-schemas.json` (committed defaults), and
 * - optionally `--db` + `DATABASE_URL` to merge layouts from PostgreSQL.
 *
 * Re-run when layout definitions change (new slots, renames, new fields).
 */
import { config } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseLayoutSchema, type LayoutFieldDef } from "../lib/cms/layout-payload";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
/** Load repo `.env` so `DATABASE_URL` is set for `pnpm cms:gen-types -- --db` (not only cwd-based). */
config({ path: join(ROOT, ".env") });
const OUT_FILE = join(ROOT, "lib/cms/generated/public-sections.ts");
const DEFAULT_JSON = join(ROOT, "lib/cms/codegen/layout-schemas.json");

type LayoutInput = {
  id?: string;
  name?: string;
  rootKey: string;
  schema: Record<string, unknown>;
};

function leafToTs(leafType: string): string {
  switch (leafType) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "link":
      return "{ value: string; href: string; target: string }";
    case "title":
    case "description":
    case "textarea":
    case "badge":
    case "image":
    case "icon":
    case "url":
    case "date":
    default:
      return "string";
  }
}

function leafToZod(leafType: string): string {
  switch (leafType) {
    case "boolean":
      return "z.boolean()";
    case "number":
      return "z.number()";
    case "link":
      return "z.object({ value: z.string(), href: z.string(), target: z.string() })";
    default:
      return "z.string()";
  }
}

function tsPropKey(k: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)) return k;
  return JSON.stringify(k);
}

function fieldToTs(def: LayoutFieldDef): string {
  if (def.type === "object") {
    return objectShapeToTs(def.fields ?? []);
  }
  if (def.type === "array") {
    const item = arrayItemToTs(def.fields ?? []);
    return `(${item})[]`;
  }
  return leafToTs(def.type);
}

function arrayItemToTs(fields: LayoutFieldDef[]): string {
  if (fields.length === 0) return "Record<string, unknown>";
  const first = fields[0];
  if (fields.length === 1 && first?.type === "object") {
    return objectShapeToTs(first.fields ?? []);
  }
  return objectShapeToTs(fields);
}

function objectShapeToTs(defs: LayoutFieldDef[]): string {
  const parts: string[] = [];
  for (const def of defs) {
    const k = def.key?.trim();
    if (!k) continue;
    parts.push(`${tsPropKey(k)}?: ${fieldToTs(def)}`);
  }
  return `{ ${parts.join("; ")} }`;
}

function fieldToZodExpr(def: LayoutFieldDef): string {
  if (def.type === "object") {
    return objectShapeToZod(def.fields ?? []);
  }
  if (def.type === "array") {
    const item = arrayItemToZod(def.fields ?? []);
    return `z.array(${item})`;
  }
  return leafToZod(def.type);
}

function arrayItemToZod(fields: LayoutFieldDef[]): string {
  if (fields.length === 0) return "z.record(z.string(), z.unknown())";
  const first = fields[0];
  if (fields.length === 1 && first?.type === "object") {
    return objectShapeToZod(first.fields ?? []);
  }
  return objectShapeToZod(fields);
}

function objectShapeToZod(defs: LayoutFieldDef[]): string {
  const parts: string[] = [];
  for (const def of defs) {
    const k = def.key?.trim();
    if (!k) continue;
    const keyLit = JSON.stringify(k);
    parts.push(`  ${keyLit}: ${fieldToZodExpr(def)}.optional(),`);
  }
  return `z.object({\n${parts.join("\n")}\n})`;
}

function mergeFieldDefs(a: LayoutFieldDef[], b: LayoutFieldDef[]): LayoutFieldDef[] {
  const byKey = new Map<string, LayoutFieldDef>();
  for (const d of a) {
    const k = d.key?.trim();
    if (!k) continue;
    byKey.set(k, d);
  }
  for (const d of b) {
    const k = d.key?.trim();
    if (!k) continue;
    const ex = byKey.get(k);
    if (!ex) {
      byKey.set(k, d);
      continue;
    }
    if (ex.type === "object" && d.type === "object") {
      byKey.set(k, {
        ...ex,
        fields: mergeFieldDefs(ex.fields ?? [], d.fields ?? []),
      });
    } else if (ex.type === "array" && d.type === "array") {
      byKey.set(k, {
        ...ex,
        fields: mergeFieldDefs(ex.fields ?? [], d.fields ?? []),
      });
    }
  }
  return Array.from(byKey.values());
}

function loadJsonLayouts(): LayoutInput[] {
  const raw = readFileSync(DEFAULT_JSON, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed as LayoutInput[];
}

async function loadDbLayouts(): Promise<LayoutInput[]> {
  const { getPrisma } = await import("../lib/server/prisma");
  const prisma = getPrisma();
  const rows = await prisma.cmsLayout.findMany({
    select: { id: true, name: true, rootKey: true, schema: true },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    rootKey: r.rootKey,
    schema:
      typeof r.schema === "object" && r.schema !== null && !Array.isArray(r.schema)
        ? (r.schema as Record<string, unknown>)
        : {},
  }));
}

function mergeLayoutsByRootKey(layouts: LayoutInput[]): Map<string, LayoutFieldDef[]> {
  const map = new Map<string, LayoutFieldDef[]>();
  for (const layout of layouts) {
    const { rootKey, defs } = parseLayoutSchema(layout.schema, layout.rootKey);
    const prev = map.get(rootKey);
    if (!prev) {
      map.set(rootKey, defs);
    } else {
      map.set(rootKey, mergeFieldDefs(prev, defs));
    }
  }
  return map;
}

function sanitizeIdent(rk: string): string {
  return rk.replace(/[^a-zA-Z0-9_]/g, "_");
}

function emit(merged: Map<string, LayoutFieldDef[]>) {
  const keys = [...merged.keys()].sort();
  const unionLiterals =
    keys.length === 0 ? "never" : keys.map((k) => JSON.stringify(k)).join(" | ");

  const typeExports: string[] = [];
  const zodConsts: string[] = [];
  const zodConstNames: { rk: string; name: string }[] = [];

  for (const rk of keys) {
    const defs = merged.get(rk)!;
    const typeName = `PublicContent_${sanitizeIdent(rk)}`;
    const zodName = `publicContentZod_${sanitizeIdent(rk)}`;
    typeExports.push(`export type ${typeName} = ${objectShapeToTs(defs)};`);
    zodConsts.push(`const ${zodName} = ${objectShapeToZod(defs)};`);
    zodConstNames.push({ rk, name: zodName });
  }

  const schemaEntries = zodConstNames
    .map(({ rk, name }) => `  ${JSON.stringify(rk)}: ${name},`)
    .join("\n");

  const discriminated =
    keys.length === 0
      ? "never"
      : keys
          .map((rk) => {
            const iface = `PublicContent_${sanitizeIdent(rk)}`;
            return `  | { id: string; displayOrder: number; sectionKey: ${JSON.stringify(rk)}; content: ${iface} }`;
          })
          .join("\n");

  const header = `/**
 * Generated by \`pnpm cms:gen-types\`. Do not edit by hand.
 * Source: lib/cms/codegen/layout-schemas.json (+ optional --db).
 */
import { z } from "zod";

`;

  const body = `${typeExports.join("\n\n")}

${zodConsts.join("\n\n")}

/** Union of \`sectionKey\` values seen in merged layout schemas. */
export type GeneratedPublicSectionKey = ${unionLiterals};

/** Zod schemas for \`content\`, keyed by \`sectionKey\`. */
export const PUBLIC_SECTION_CONTENT_SCHEMAS = {
${schemaEntries}
} as const satisfies Partial<
  Record<GeneratedPublicSectionKey, z.ZodType<Record<string, unknown>>>
>;

/** Known blocks from codegen; unknown \`sectionKey\` values stay loose at compile time. */
export type GeneratedPublicBlockKnown =
${discriminated};

export type GeneratedPublicBlockUnknown = {
  id: string;
  displayOrder: number;
  sectionKey: string;
  content: Record<string, unknown>;
};

/** Matches \`shapePublicBlock\` when the config is empty or invalid. */
export type GeneratedPublicBlockEmpty = {
  id: string;
  displayOrder: number;
  sectionKey: null;
  content: Record<string, unknown>;
};

export type GeneratedPublicBlock =
  | GeneratedPublicBlockKnown
  | GeneratedPublicBlockUnknown
  | GeneratedPublicBlockEmpty;
`;

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, header + body, "utf8");
  console.log(`Wrote ${OUT_FILE} (${keys.length} section keys)`);
}

async function main() {
  let layouts = loadJsonLayouts();
  if (process.argv.includes("--db")) {
    try {
      const dbLayouts = await loadDbLayouts();
      layouts = [...layouts, ...dbLayouts];
    } catch (e) {
      console.error("cms-gen-types: --db failed, using JSON only:", e);
    }
  }
  emit(mergeLayoutsByRootKey(layouts));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

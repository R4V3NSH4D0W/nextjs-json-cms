import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
  /** Busts cache when `prisma generate` adds/changes CmsPage columns (e.g. `published`, `draftData`). */
  cmsPageSchemaKey: string | undefined;
};

/** After `prisma generate`, new model delegates exist; a cached client from before generate does not. */
function prismaClientIsStale(client: PrismaClient): boolean {
  const c = client as { cmsPage?: unknown };
  return typeof c.cmsPage === "undefined";
}

function currentCmsPageSchemaKey(): string {
  return Object.keys(Prisma.CmsPageScalarFieldEnum).sort().join(",");
}

/**
 * Prisma 7 + PostgreSQL via driver adapter. Reused across dev hot reloads.
 */
export function getPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const cmsKey = currentCmsPageSchemaKey();
  if (
    globalForPrisma.prisma &&
    (prismaClientIsStale(globalForPrisma.prisma) ||
      globalForPrisma.cmsPageSchemaKey !== cmsKey)
  ) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    if (!globalForPrisma.pgPool) {
      globalForPrisma.pgPool = new Pool({ connectionString: url });
    }
    const adapter = new PrismaPg(globalForPrisma.pgPool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
    globalForPrisma.cmsPageSchemaKey = cmsKey;
  }
  return globalForPrisma.prisma;
}

import { getPrisma } from "./prisma";

export type DbStatus =
  | { connected: true; database: string; user: string }
  | { connected: false; reason: string };

/**
 * Ping Postgres via Prisma. Safe to call from API routes; does not throw.
 */
export async function getDbStatus(): Promise<DbStatus> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { connected: false, reason: "DATABASE_URL is not set" };
  }
  try {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw<
      { db: string; db_user: string }[]
    >`SELECT current_database() AS db, current_user AS db_user`;
    const row = rows[0];
    if (!row) {
      return { connected: false, reason: "No row from database" };
    }
    return {
      connected: true,
      database: row.db,
      user: row.db_user,
    };
  } catch (e) {
    return {
      connected: false,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
}

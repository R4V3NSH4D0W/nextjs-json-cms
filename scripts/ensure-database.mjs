#!/usr/bin/env node
/**
 * Creates the database named in DATABASE_URL if it does not exist.
 * Connects to the maintenance database `postgres` with the same credentials.
 *
 * Usage: pnpm db:ensure
 */
import "dotenv/config";
import pg from "pg";

const { Client } = pg;

function parseTargetDatabaseName(databaseUrl) {
  let u;
  try {
    u = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL");
  }
  const name = u.pathname.replace(/^\//, "").split("/")[0];
  if (!name || name === "postgres") {
    return null;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(
      `Unsafe or invalid database name in DATABASE_URL: use only letters, numbers, underscore.`,
    );
  }
  return name;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
    process.exit(1);
  }

  const targetDb = parseTargetDatabaseName(databaseUrl);
  if (!targetDb) {
    console.log("DATABASE_URL uses database `postgres`; skipping create-database step.");
    return;
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  try {
    const { rows } = await client.query(
      "SELECT 1 AS x FROM pg_database WHERE datname = $1",
      [targetDb],
    );
    if (rows.length > 0) {
      console.log(`Database "${targetDb}" already exists.`);
      return;
    }

    await client.query(`CREATE DATABASE "${targetDb.replace(/"/g, '""')}"`);
    console.log(`Created database "${targetDb}".`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
